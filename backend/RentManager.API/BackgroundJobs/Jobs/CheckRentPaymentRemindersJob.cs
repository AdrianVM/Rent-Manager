using Hangfire;
using Microsoft.EntityFrameworkCore;
using RentManager.API.Data;
using RentManager.API.Models;
using RentManager.API.Services.Email;

namespace RentManager.API.BackgroundJobs.Jobs;

/// <summary>
/// Recurring background job that checks for upcoming rent payments daily
/// and sends reminder emails 3 days before the due date
/// </summary>
public class CheckRentPaymentRemindersJob
{
    private readonly IUnitOfWork _context;
    private readonly IBackgroundEmailService _backgroundEmailService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<CheckRentPaymentRemindersJob> _logger;

    // Days before rent due date to send reminder (configurable)
    private readonly int _daysBefore = 3;

    // Default rent due day of month (5th of each month)
    private readonly int _rentDueDayOfMonth = 5;

    public CheckRentPaymentRemindersJob(
        IUnitOfWork context,
        IBackgroundEmailService backgroundEmailService,
        IConfiguration configuration,
        ILogger<CheckRentPaymentRemindersJob> logger)
    {
        _context = context;
        _backgroundEmailService = backgroundEmailService;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Check for upcoming rent payments and send reminder emails
    /// Runs daily at 9:00 AM
    /// </summary>
    [AutomaticRetry(Attempts = 3)]
    public async Task ExecuteAsync(IJobCancellationToken cancellationToken)
    {
        _logger.LogInformation("Starting rent payment reminder check job at {Time}", DateTimeOffset.UtcNow);

        try
        {
            var today = DateTimeOffset.UtcNow.Date;
            var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:3000";

            // Calculate the due date for the current month
            var currentMonth = new DateTimeOffset(today.Year, today.Month, 1, 0, 0, 0, TimeSpan.Zero);
            var dueDate = currentMonth.AddDays(_rentDueDayOfMonth - 1); // Day 5 of current month

            // Calculate reminder date (3 days before due)
            var reminderDate = dueDate.AddDays(-_daysBefore);

            // Only send reminders on the reminder date
            if (today.Date != reminderDate.Date)
            {
                _logger.LogInformation("Today is not a reminder date. Reminder date: {ReminderDate}, Today: {Today}",
                    reminderDate.ToString("yyyy-MM-dd"),
                    today.ToString("yyyy-MM-dd"));
                return;
            }

            _logger.LogInformation("Sending rent reminders for payments due on {DueDate}", dueDate.ToString("MMMM d, yyyy"));

            // Get all active tenants
            var activeTenants = await _context.Tenants
                .AsNoTracking()
                .Include(t => t.Property)
                    .ThenInclude(p => p.PropertyOwners)
                        .ThenInclude(po => po.PersonOwners)
                .Include(t => t.Person)
                .Include(t => t.Company)
                .Where(t => t.Status == TenantStatus.Active && t.LeaseStart.HasValue)
                .ToListAsync(cancellationToken.ShutdownToken);

            _logger.LogInformation("Found {TenantCount} active tenants to check", activeTenants.Count);

            var remindersCount = 0;

            foreach (var tenant in activeTenants)
            {
                // Check if lease has started for this month
                if (tenant.LeaseStart > currentMonth)
                {
                    // Lease hasn't started yet for this month
                    continue;
                }

                // Check if payment has already been made for this month
                var paymentMadeThisMonth = await _context.Payments
                    .AsNoTracking()
                    .AnyAsync(p =>
                        p.TenantId == tenant.Id &&
                        p.Status == PaymentStatus.Completed &&
                        p.RecurringForMonth.HasValue &&
                        p.RecurringForMonth.Value.Year == currentMonth.Year &&
                        p.RecurringForMonth.Value.Month == currentMonth.Month,
                        cancellationToken.ShutdownToken);

                if (paymentMadeThisMonth)
                {
                    // Payment already made, no reminder needed
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

                // Count on-time payments this year
                var yearStart = new DateTimeOffset(today.Year, 1, 1, 0, 0, 0, TimeSpan.Zero);
                var onTimePaymentsThisYear = await _context.Payments
                    .AsNoTracking()
                    .Where(p =>
                        p.TenantId == tenant.Id &&
                        p.Status == PaymentStatus.Completed &&
                        p.RecurringForMonth.HasValue &&
                        p.RecurringForMonth.Value >= yearStart &&
                        p.CreatedAt <= p.RecurringForMonth.Value.AddDays(_rentDueDayOfMonth))
                    .CountAsync(cancellationToken.ShutdownToken);

                // Prepare email data
                var emailData = new RentPaymentReminderEmailData
                {
                    TenantFirstName = tenant.TenantType == TenantType.Person
                        ? tenant.Person?.FirstName ?? "Tenant"
                        : tenant.Company?.CompanyName ?? "Tenant",
                    TenantEmail = tenant.Email,
                    PropertyAddress = tenant.Property.Address,
                    RentAmount = tenant.RentAmount,
                    DueDate = dueDate.ToString("MMMM d, yyyy"),
                    DaysUntilDue = _daysBefore,
                    PaymentStatus = $"Not yet paid for {currentMonth:MMMM}",
                    PaymentUrl = $"{frontendUrl}/payments",
                    BankTransferIBAN = "RO49AAAA1B31007593840000", // Placeholder - should be from property owner
                    BankTransferAccountHolder = ownerName,
                    BankTransferReference = $"RENT-{currentMonth:yyyyMM}-{tenant.Id[..8].ToUpper()}",
                    OwnerName = ownerName,
                    OwnerEmail = "owner@rentflow.ro",
                    OwnerPhone = ownerPerson.Phone,
                    FrontendUrl = frontendUrl,
                    OnTimePaymentsThisYear = onTimePaymentsThisYear
                };

                var subject = $"Rent Reminder: {tenant.RentAmount:N0} RON due in {_daysBefore} days ({dueDate:MMMM d})";

                // Enqueue the email
                var jobId = _backgroundEmailService.EnqueueRentPaymentReminderEmail(emailData, subject);

                _logger.LogInformation(
                    "Rent payment reminder queued for tenant {TenantId} ({Email}), {Amount} RON due in {Days} days, JobId: {JobId}",
                    tenant.Id,
                    tenant.Email,
                    tenant.RentAmount,
                    _daysBefore,
                    jobId);

                remindersCount++;
            }

            _logger.LogInformation(
                "Rent payment reminder check completed. Sent {RemindersCount} reminders out of {TotalTenants} active tenants",
                remindersCount,
                activeTenants.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while checking for rent payment reminders");
            throw;
        }
    }
}
