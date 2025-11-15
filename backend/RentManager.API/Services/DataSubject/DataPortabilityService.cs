using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using RentManager.API.Data;

namespace RentManager.API.Services.DataSubject;

public interface IDataPortabilityService
{
    Task<string> GeneratePortableExportAsync(string userId);
    Task<byte[]> GeneratePortableExportCsvAsync(string userId);
}

/// <summary>
/// Service for GDPR Article 20 - Right to Data Portability
/// Generates machine-readable exports of user-provided data only (excludes derived/system data)
/// </summary>
public class DataPortabilityService : IDataPortabilityService
{
    private readonly RentManagerDbContext _context;
    private readonly ILogger<DataPortabilityService> _logger;

    public DataPortabilityService(
        RentManagerDbContext context,
        ILogger<DataPortabilityService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Generates portable JSON export (user-provided data only, per GDPR Article 20)
    /// </summary>
    public async Task<string> GeneratePortableExportAsync(string userId)
    {
        _logger.LogInformation("Generating portable data export for user {UserId}", userId);

        var portableData = new Dictionary<string, object>();

        // User Profile (user-provided data only)
        var user = await _context.Users
            .Include(u => u.Person)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user?.Person != null)
        {
            portableData["profile"] = new
            {
                user.Email,
                user.Person.FirstName,
                user.Person.MiddleName,
                user.Person.LastName,
                user.Person.DateOfBirth,
                user.Person.Nationality,
                user.Person.Occupation,
                user.Person.Phone
            };
        }
        else if (user != null)
        {
            portableData["profile"] = new
            {
                user.Email
            };
        }

        // Properties (user-created data)
        var properties = await _context.Properties
            .Where(p => p.PropertyOwners.Any(po => po.PersonOwners.Any(person =>
                _context.Users.Any(u => u.Id == userId && u.PersonId == person.Id))))
            .Select(p => new
            {
                p.Name,
                p.Address,
                p.Type,
                p.Bedrooms,
                p.Bathrooms,
                p.RentAmount,
                p.SquareFootage,
                p.Description,
                p.ParkingType,
                p.SpaceNumber
            })
            .ToListAsync();

        if (properties.Any())
        {
            portableData["properties"] = properties;
        }

        // Tenant Information (user-provided data)
        var tenants = await _context.Tenants
            .Include(t => t.Property)
            .Where(t => _context.Users.Any(u => u.Id == userId && (u.Email == t.Email || u.PersonId == t.PersonId)))
            .Select(t => new
            {
                t.Email,
                t.Phone,
                t.EmergencyContactName,
                t.EmergencyContactPhone,
                t.EmergencyContactRelation,
                t.LeaseStart,
                t.LeaseEnd,
                PropertyAddress = t.Property.Address
            })
            .ToListAsync();

        if (tenants.Any())
        {
            portableData["lease_information"] = tenants;
        }

        // Maintenance Requests (user-submitted data)
        var tenantIds = tenants.Select(t => new { t.Email, t.Phone }).ToList();
        if (tenantIds.Any())
        {
            var maintenanceRequests = await _context.MaintenanceRequests
                .Include(mr => mr.Property)
                .Where(mr => _context.Tenants.Any(t => t.Id == mr.TenantId &&
                    _context.Users.Any(u => u.Id == userId && (u.Email == t.Email || u.PersonId == t.PersonId))))
                .Select(mr => new
                {
                    mr.Title,
                    mr.Description,
                    mr.Priority,
                    mr.CreatedAt,
                    PropertyAddress = mr.Property.Address
                })
                .ToListAsync();

            if (maintenanceRequests.Any())
            {
                portableData["maintenance_requests"] = maintenanceRequests;
            }
        }

        // Preferences (user-selected preferences)
        var cookieConsents = await _context.CookieConsents
            .Where(cc => cc.UserId == userId)
            .OrderByDescending(cc => cc.ConsentDate)
            .Take(1)
            .Select(cc => new
            {
                cc.StrictlyNecessary,
                cc.Functional,
                cc.Performance,
                cc.Marketing,
                cc.ConsentDate
            })
            .FirstOrDefaultAsync();

        if (cookieConsents != null)
        {
            portableData["cookie_preferences"] = cookieConsents;
        }

        var export = new
        {
            ExportedAt = DateTimeOffset.UtcNow,
            DataSubject = userId,
            LegalBasis = "GDPR Article 20 - Right to Data Portability",
            Format = "JSON",
            Note = "This export contains only data you provided to us. System-generated data (logs, analytics, etc.) is excluded per GDPR Article 20.",
            Data = portableData
        };

        var options = new JsonSerializerOptions
        {
            WriteIndented = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        var json = JsonSerializer.Serialize(export, options);

        _logger.LogInformation(
            "Portable data export generated for user {UserId}. Size: {Size} bytes",
            userId,
            json.Length
        );

        return json;
    }

    /// <summary>
    /// Generates portable CSV export for easy import into other systems
    /// </summary>
    public async Task<byte[]> GeneratePortableExportCsvAsync(string userId)
    {
        _logger.LogInformation("Generating portable CSV export for user {UserId}", userId);

        // For simplicity, we'll create a JSON export and return it as bytes
        // In a real implementation, you would generate proper CSV files
        var json = await GeneratePortableExportAsync(userId);
        return System.Text.Encoding.UTF8.GetBytes(json);
    }
}
