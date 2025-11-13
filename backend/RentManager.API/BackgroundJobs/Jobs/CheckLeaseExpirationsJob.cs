using Hangfire;
using Microsoft.EntityFrameworkCore;
using RentManager.API.Data;
using RentManager.API.Models;
using RentManager.API.Services.Email;

namespace RentManager.API.BackgroundJobs.Jobs;

/// <summary>
/// Recurring background job that checks for upcoming lease expirations daily
/// and sends warning emails at 60, 30, and 7 days before expiration
/// </summary>
public class CheckLeaseExpirationsJob
{
    private readonly RentManagerDbContext _context;
    private readonly IBackgroundEmailService _backgroundEmailService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<CheckLeaseExpirationsJob> _logger;

    // Notification intervals in days before expiration
    private readonly int[] _notificationIntervals = { 60, 30, 7 };

    public CheckLeaseExpirationsJob(
        RentManagerDbContext context,
        IBackgroundEmailService backgroundEmailService,
        IConfiguration configuration,
        ILogger<CheckLeaseExpirationsJob> logger)
    {
        _context = context;
        _backgroundEmailService = backgroundEmailService;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Check for upcoming lease expirations and send warning emails
    /// Runs daily at 9:00 AM
    /// </summary>
    [AutomaticRetry(Attempts = 3)]
    public async Task ExecuteAsync(IJobCancellationToken cancellationToken)
    {
        _logger.LogInformation("Starting lease expiration check job at {Time}", DateTimeOffset.UtcNow);

        try
        {
            var today = DateTimeOffset.UtcNow.Date;
            var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:3000";
            var notificationsCount = 0;

            // Check each notification interval (60, 30, 7 days)
            foreach (var daysBeforeExpiration in _notificationIntervals)
            {
                var targetExpirationDate = today.AddDays(daysBeforeExpiration);

                // Find all active tenants whose lease expires on the target date
                var expiringLeases = await _context.Tenants
                    .Include(t => t.Property)
                        .ThenInclude(p => p.PropertyOwners)
                            .ThenInclude(po => po.PersonOwners)
                    .Include(t => t.Person)
                    .Include(t => t.Company)
                    .Where(t =>
                        t.Status == TenantStatus.Active &&
                        t.LeaseEnd.HasValue &&
                        t.LeaseEnd.Value.Date == targetExpirationDate)
                    .ToListAsync(cancellationToken.ShutdownToken);

                _logger.LogInformation(
                    "Found {Count} leases expiring in {Days} days",
                    expiringLeases.Count,
                    daysBeforeExpiration);

                foreach (var tenant in expiringLeases)
                {
                    // Get property owner information
                    var propertyOwner = tenant.Property.PropertyOwners.FirstOrDefault();
                    var ownerPerson = propertyOwner?.PersonOwners?.FirstOrDefault();

                    if (ownerPerson == null)
                    {
                        _logger.LogWarning("No property owner found for tenant {TenantId}", tenant.Id);
                        continue;
                    }

                    var ownerName = ownerPerson.FullName ?? "Property Owner";

                    // Determine urgency level based on days until expiration
                    string urgencyLevel = daysBeforeExpiration switch
                    {
                        60 => "notice",
                        30 => "reminder",
                        7 => "urgent",
                        _ => "notice"
                    };

                    // Prepare email data
                    var emailData = new LeaseExpirationEmailData
                    {
                        TenantFirstName = tenant.TenantType == TenantType.Person
                            ? tenant.Person?.FirstName ?? "Tenant"
                            : tenant.Company?.CompanyName ?? "Tenant",
                        TenantEmail = tenant.Email,
                        PropertyAddress = tenant.Property.Address,
                        LeaseEndDate = tenant.LeaseEnd!.Value.ToString("MMMM d, yyyy"),
                        DaysUntilExpiration = daysBeforeExpiration,
                        LeaseStartDate = tenant.LeaseStart?.ToString("MMMM d, yyyy") ?? "N/A",
                        CurrentRentAmount = tenant.RentAmount,
                        RenewalUrl = $"{frontendUrl}/renewal",
                        OwnerName = ownerName,
                        OwnerEmail = "owner@rentflow.ro",
                        OwnerPhone = ownerPerson.Phone,
                        FrontendUrl = frontendUrl,
                        UrgencyLevel = urgencyLevel
                    };

                    // Create appropriate subject based on urgency
                    var subject = daysBeforeExpiration switch
                    {
                        60 => $"Lease Expiring in 2 Months - {tenant.Property.Address}",
                        30 => $"Lease Expiring in 30 Days - Action Required - {tenant.Property.Address}",
                        7 => $"⚠️ URGENT: Lease Expires in 1 Week - {tenant.Property.Address}",
                        _ => $"Lease Expiration Notice - {tenant.Property.Address}"
                    };

                    // Enqueue the email
                    var jobId = _backgroundEmailService.EnqueueLeaseExpirationEmail(emailData, subject);

                    _logger.LogInformation(
                        "Lease expiration warning queued for tenant {TenantId} ({Email}), {Days} days until expiration, JobId: {JobId}",
                        tenant.Id,
                        tenant.Email,
                        daysBeforeExpiration,
                        jobId);

                    notificationsCount++;
                }
            }

            _logger.LogInformation(
                "Lease expiration check completed. Sent {NotificationsCount} warnings",
                notificationsCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while checking for lease expirations");
            throw;
        }
    }
}
