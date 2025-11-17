using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using RentManager.API.Data;

namespace RentManager.API.Services.DataSubject;

public interface IDataAccessService
{
    Task<string> GenerateDataExportAsync(string userId);
    Task<List<string>> GetUserDataCategoriesAsync(string userId);
    Task<Dictionary<string, object>> GetUserDataAsync(string userId);
}

public class DataAccessService : IDataAccessService
{
    private readonly IUnitOfWork _context;
    private readonly ILogger<DataAccessService> _logger;

    public DataAccessService(
        IUnitOfWork context,
        ILogger<DataAccessService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Generates a comprehensive JSON export of all user data
    /// </summary>
    public async Task<string> GenerateDataExportAsync(string userId)
    {
        _logger.LogInformation("Generating data export for user {UserId}", userId);

        var userData = await GetUserDataAsync(userId);

        // Add metadata
        var export = new
        {
            ExportedAt = DateTimeOffset.UtcNow,
            UserId = userId,
            DataCategories = userData.Keys.ToList(),
            LegalBasis = "GDPR Article 15 - Right of Access",
            Data = userData
        };

        var options = new JsonSerializerOptions
        {
            WriteIndented = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        var json = JsonSerializer.Serialize(export, options);

        _logger.LogInformation(
            "Data export generated for user {UserId}. Size: {Size} bytes, Categories: {Categories}",
            userId,
            json.Length,
            userData.Count
        );

        return json;
    }

    /// <summary>
    /// Gets list of data categories held for a user
    /// </summary>
    public async Task<List<string>> GetUserDataCategoriesAsync(string userId)
    {
        var categories = new List<string>();

        // Check User profile
        var hasUser = await _context.Users.AnyAsync(u => u.Id == userId);
        if (hasUser) categories.Add("user_profile");

        // Check Properties (as owner)
        var hasProperties = await _context.Properties
            .AnyAsync(p => p.PropertyOwners.Any(po => po.PersonOwners.Any(person =>
                _context.Users.Any(u => u.Id == userId && u.PersonId == person.Id))));
        if (hasProperties) categories.Add("properties");

        // Check Tenants
        var hasTenants = await _context.Tenants.AnyAsync(t =>
            _context.Users.Any(u => u.Id == userId && (u.Email == t.Email || u.PersonId == t.PersonId)));
        if (hasTenants) categories.Add("tenants");

        // Check Payments
        var hasPayments = await _context.Payments.AnyAsync(p =>
            _context.Tenants.Any(t => t.Id == p.TenantId &&
                _context.Users.Any(u => u.Id == userId && (u.Email == t.Email || u.PersonId == t.PersonId))));
        if (hasPayments) categories.Add("payments");

        // Check Contracts
        var hasContracts = await _context.Contracts.AnyAsync(c =>
            _context.Tenants.Any(t => t.Id == c.TenantId &&
                _context.Users.Any(u => u.Id == userId && (u.Email == t.Email || u.PersonId == t.PersonId))));
        if (hasContracts) categories.Add("contracts");

        // Check Maintenance Requests
        var hasMaintenanceRequests = await _context.MaintenanceRequests.AnyAsync(mr =>
            _context.Tenants.Any(t => t.Id == mr.TenantId &&
                _context.Users.Any(u => u.Id == userId && (u.Email == t.Email || u.PersonId == t.PersonId))));
        if (hasMaintenanceRequests) categories.Add("maintenance_requests");

        // Check Cookie Consents
        var hasCookieConsents = await _context.CookieConsents.AnyAsync(cc => cc.UserId == userId);
        if (hasCookieConsents) categories.Add("cookie_consents");

        // Check Privacy Policy Acceptances
        var hasPrivacyAcceptances = await _context.UserPrivacyPolicyAcceptances.AnyAsync(pa => pa.UserId == userId);
        if (hasPrivacyAcceptances) categories.Add("privacy_policy_acceptances");

        // Check Data Subject Requests
        var hasDataRequests = await _context.DataSubjectRequests.AnyAsync(dr => dr.UserId == userId);
        if (hasDataRequests) categories.Add("data_subject_requests");

        return categories;
    }

    /// <summary>
    /// Gets all user data organized by category
    /// </summary>
    public async Task<Dictionary<string, object>> GetUserDataAsync(string userId)
    {
        var userData = new Dictionary<string, object>();

        // User Profile
        var user = await _context.Users
            .Include(u => u.Person)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user != null)
        {
            userData["user_profile"] = new
            {
                user.Id,
                user.Email,
                user.IsActive,
                user.CreatedAt,
                user.UpdatedAt,
                user.LastLoginAt,
                Person = user.Person != null ? new
                {
                    user.Person.FirstName,
                    user.Person.MiddleName,
                    user.Person.LastName,
                    user.Person.DateOfBirth,
                    user.Person.IdNumber,
                    user.Person.Nationality,
                    user.Person.Occupation,
                    user.Person.Phone
                } : null,
                Roles = user.UserRoles.Select(ur => ur.Role.Name).ToList()
            };
        }

        // Properties (as owner)
        var properties = await _context.Properties
            .Include(p => p.PropertyOwners)
                .ThenInclude(po => po.PersonOwners)
            .Where(p => p.PropertyOwners.Any(po => po.PersonOwners.Any(person =>
                _context.Users.Any(u => u.Id == userId && u.PersonId == person.Id))))
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.Address,
                p.Type,
                p.Bedrooms,
                p.Bathrooms,
                p.RentAmount,
                p.SquareFootage,
                p.Description,
                p.CreatedAt,
                p.UpdatedAt
            })
            .ToListAsync();

        if (properties.Any())
        {
            userData["properties"] = properties;
        }

        // Tenants
        var tenants = await _context.Tenants
            .Include(t => t.Property)
            .Where(t => _context.Users.Any(u => u.Id == userId && (u.Email == t.Email || u.PersonId == t.PersonId)))
            .Select(t => new
            {
                t.Id,
                t.Email,
                t.Phone,
                t.RentAmount,
                t.Deposit,
                t.LeaseStart,
                t.LeaseEnd,
                t.Status,
                t.CreatedAt,
                t.UpdatedAt,
                Property = new
                {
                    t.Property.Name,
                    t.Property.Address
                }
            })
            .ToListAsync();

        if (tenants.Any())
        {
            userData["tenants"] = tenants;
        }

        // Payments
        var tenantIds = tenants.Select(t => t.Id).ToList();
        if (tenantIds.Any())
        {
            var payments = await _context.Payments
                .Where(p => tenantIds.Contains(p.TenantId))
                .Select(p => new
                {
                    p.Id,
                    p.Amount,
                    p.Date,
                    p.Method,
                    p.Status,
                    p.Notes,
                    p.RecurringForMonth,
                    p.CreatedAt
                })
                .ToListAsync();

            if (payments.Any())
            {
                userData["payments"] = payments;
            }

            // Contracts (excludes FileContentBase64 for size reasons, but notes it exists)
            var contracts = await _context.Contracts
                .Where(c => tenantIds.Contains(c.TenantId))
                .Select(c => new
                {
                    c.Id,
                    c.FileName,
                    c.MimeType,
                    c.FileSizeBytes,
                    c.UploadedAt,
                    c.Status,
                    c.Notes,
                    Note = "Contract file available upon request"
                })
                .ToListAsync();

            if (contracts.Any())
            {
                userData["contracts"] = contracts;
            }

            // Maintenance Requests
            var maintenanceRequests = await _context.MaintenanceRequests
                .Where(mr => tenantIds.Contains(mr.TenantId))
                .Select(mr => new
                {
                    mr.Id,
                    mr.Title,
                    mr.Description,
                    mr.Status,
                    mr.Priority,
                    mr.AssignedTo,
                    mr.ResolutionNotes,
                    mr.CreatedAt,
                    mr.UpdatedAt
                })
                .ToListAsync();

            if (maintenanceRequests.Any())
            {
                userData["maintenance_requests"] = maintenanceRequests;
            }
        }

        // Cookie Consents
        var cookieConsents = await _context.CookieConsents
            .Where(cc => cc.UserId == userId)
            .Select(cc => new
            {
                cc.StrictlyNecessary,
                cc.Functional,
                cc.Performance,
                cc.Marketing,
                cc.ConsentDate,
                cc.LastUpdated,
                cc.PolicyVersion,
                cc.IpAddress,
                cc.UserAgent
            })
            .ToListAsync();

        if (cookieConsents.Any())
        {
            userData["cookie_consents"] = cookieConsents;
        }

        // Privacy Policy Acceptances
        var privacyAcceptances = await _context.UserPrivacyPolicyAcceptances
            .Include(pa => pa.PolicyVersion)
            .Where(pa => pa.UserId == userId)
            .Select(pa => new
            {
                PolicyVersion = pa.PolicyVersion.Version,
                pa.AcceptedAt,
                pa.IpAddress,
                pa.UserAgent,
                pa.AcceptanceMethod,
                pa.WasShownChangesSummary
            })
            .ToListAsync();

        if (privacyAcceptances.Any())
        {
            userData["privacy_policy_acceptances"] = privacyAcceptances;
        }

        // Data Subject Requests
        var dataRequests = await _context.DataSubjectRequests
            .Include(dr => dr.History)
            .Where(dr => dr.UserId == userId)
            .Select(dr => new
            {
                dr.Id,
                dr.RequestType,
                dr.Status,
                dr.Description,
                dr.SubmittedAt,
                dr.DeadlineAt,
                dr.CompletedAt,
                dr.IpAddress,
                dr.UserAgent,
                History = dr.History.Select(h => new
                {
                    h.Action,
                    h.Details,
                    h.PerformedAt,
                    h.PerformedByRole
                }).ToList()
            })
            .ToListAsync();

        if (dataRequests.Any())
        {
            userData["data_subject_requests"] = dataRequests;
        }

        return userData;
    }
}
