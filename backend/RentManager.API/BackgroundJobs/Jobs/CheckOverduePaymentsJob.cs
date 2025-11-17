using Hangfire;
using Microsoft.EntityFrameworkCore;
using RentManager.API.Data;
using RentManager.API.Models;
using RentManager.API.Services.Email;

namespace RentManager.API.BackgroundJobs.Jobs;

/// <summary>
/// Recurring background job that checks for overdue payments daily
/// and sends alert emails to tenants who are 1+ days overdue
/// </summary>
public class CheckOverduePaymentsJob
{
    private readonly IUnitOfWork _context;
    private readonly IBackgroundEmailService _backgroundEmailService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<CheckOverduePaymentsJob> _logger;

    public CheckOverduePaymentsJob(
        IUnitOfWork context,
        IBackgroundEmailService backgroundEmailService,
        IConfiguration configuration,
        ILogger<CheckOverduePaymentsJob> logger)
    {
        _context = context;
        _backgroundEmailService = backgroundEmailService;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Check for overdue payments and send alert emails
    /// Runs daily at 9:00 AM
    /// </summary>
    [AutomaticRetry(Attempts = 3)]
    public async Task ExecuteAsync(IJobCancellationToken cancellationToken)
    {
        _logger.LogInformation("Starting overdue payment check job at {Time}", DateTimeOffset.UtcNow);

        try
        {
            // Get all active tenants with their properties and owners
            var activeTenants = await _context.Tenants
                .Include(t => t.Property)
                    .ThenInclude(p => p.PropertyOwners)
                        .ThenInclude(po => po.PersonOwners)
                .Include(t => t.Person)
                .Include(t => t.Company)
                .Where(t => t.Status == TenantStatus.Active && t.LeaseStart.HasValue)
                .ToListAsync(cancellationToken.ShutdownToken);

            _logger.LogInformation("Found {TenantCount} active tenants to check", activeTenants.Count);

            var today = DateTimeOffset.UtcNow.Date;
            var overdueAlertsCount = 0;
            var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:3000";

            foreach (var tenant in activeTenants)
            {
                // Calculate the rent due date for current month (assume rent due on day 1 of each month)
                var currentMonth = new DateTimeOffset(today.Year, today.Month, 1, 0, 0, 0, TimeSpan.Zero);

                // Check if rent is due (lease has started and we're past day 1 of the month)
                if (tenant.LeaseStart > currentMonth)
                {
                    // Lease hasn't started yet for this month
                    continue;
                }

                // Check if payment has been made for this month
                var paymentMadeThisMonth = await _context.Payments
                    .AnyAsync(p =>
                        p.TenantId == tenant.Id &&
                        p.Status == PaymentStatus.Completed &&
                        p.RecurringForMonth.HasValue &&
                        p.RecurringForMonth.Value.Year == currentMonth.Year &&
                        p.RecurringForMonth.Value.Month == currentMonth.Month,
                        cancellationToken.ShutdownToken);

                if (paymentMadeThisMonth)
                {
                    // Payment already made for this month
                    continue;
                }

                // Calculate days overdue (starting from day 2 of the month)
                var dueDate = currentMonth.AddDays(1); // Day 1 is the due date
                var daysOverdue = (today - dueDate.Date).Days;

                // Only send alert if 1 or more days overdue
                if (daysOverdue < 1)
                {
                    continue;
                }

                // Get property owner information
                var propertyOwner = tenant.Property.PropertyOwners.FirstOrDefault();
                var ownerPerson = propertyOwner?.PersonOwners?.FirstOrDefault();

                if (ownerPerson == null)
                {
                    _logger.LogWarning("No property owner found for tenant {TenantId}", tenant.Id);
                    continue;
                }

                var ownerName = ownerPerson.FullName ?? "Property Owner";

                // Calculate late fee if applicable (e.g., 50 RON after 1 day)
                decimal? lateFee = daysOverdue >= 1 ? 50m : null;
                var totalAmountDue = tenant.RentAmount + (lateFee ?? 0);

                // Prepare email data
                var emailData = new OverduePaymentEmailData
                {
                    TenantFirstName = tenant.TenantType == TenantType.Person
                        ? tenant.Person?.FirstName ?? "Tenant"
                        : tenant.Company?.CompanyName ?? "Tenant",
                    TenantEmail = tenant.Email,
                    PropertyAddress = tenant.Property.Address,
                    RentAmount = tenant.RentAmount,
                    DueDate = dueDate.ToString("MMMM d, yyyy"),
                    DaysOverdue = daysOverdue,
                    LateFee = lateFee,
                    TotalAmountDue = totalAmountDue,
                    PaymentUrl = $"{frontendUrl}/payments",
                    OwnerName = ownerName,
                    OwnerEmail = "owner@rentflow.ro", // Default email since Person model doesn't have Email
                    OwnerPhone = ownerPerson.Phone,
                    FrontendUrl = frontendUrl
                };

                var subject = $"⚠️ Rent Payment Overdue - {tenant.Property.Address}";

                // Enqueue the email
                var jobId = _backgroundEmailService.EnqueueOverduePaymentEmail(emailData, subject);

                _logger.LogInformation(
                    "Overdue payment alert queued for tenant {TenantId} ({Email}), {DaysOverdue} days overdue, JobId: {JobId}",
                    tenant.Id,
                    tenant.Email,
                    daysOverdue,
                    jobId);

                overdueAlertsCount++;
            }

            _logger.LogInformation(
                "Overdue payment check completed. Sent {AlertsCount} alerts out of {TotalTenants} active tenants",
                overdueAlertsCount,
                activeTenants.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while checking for overdue payments");
            throw;
        }
    }
}
