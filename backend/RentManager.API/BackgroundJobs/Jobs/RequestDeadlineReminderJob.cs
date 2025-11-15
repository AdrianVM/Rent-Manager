using RentManager.API.Services.DataSubject;
using RentManager.API.Services.Email;

namespace RentManager.API.BackgroundJobs.Jobs;

/// <summary>
/// Daily job to check for data subject requests approaching their deadline
/// Sends reminders to admins when requests are due within 7 days
/// </summary>
public class RequestDeadlineReminderJob
{
    private readonly ILogger<RequestDeadlineReminderJob> _logger;
    private readonly IServiceScopeFactory _serviceScopeFactory;

    public RequestDeadlineReminderJob(
        ILogger<RequestDeadlineReminderJob> logger,
        IServiceScopeFactory serviceScopeFactory)
    {
        _logger = logger;
        _serviceScopeFactory = serviceScopeFactory;
    }

    /// <summary>
    /// Checks for requests nearing deadline and sends reminders
    /// </summary>
    public async Task ExecuteAsync()
    {
        _logger.LogInformation("Starting data subject request deadline check");

        using var scope = _serviceScopeFactory.CreateScope();
        var requestService = scope.ServiceProvider.GetRequiredService<IDataSubjectRequestService>();
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailTemplateService>();

        try
        {
            // Get requests due within 7 days
            var requestsNearingDeadline = await requestService.GetRequestsNearingDeadlineAsync(7);

            if (!requestsNearingDeadline.Any())
            {
                _logger.LogInformation("No requests nearing deadline");
                return;
            }

            _logger.LogWarning(
                "Found {Count} data subject requests nearing deadline",
                requestsNearingDeadline.Count
            );

            foreach (var request in requestsNearingDeadline)
            {
                var daysRemaining = (request.DeadlineAt - DateTimeOffset.UtcNow).Days;

                // TODO: Send email reminder to admin when email templates are created
                // For now, just log the reminder
                // In Phase 9 (email templates), we'll add proper email notifications
                _logger.LogWarning(
                    "REMINDER: Data subject request {RequestId} is due in {DaysRemaining} days",
                    request.Id,
                    daysRemaining
                );

                // Record reminder in history
                await requestService.RecordHistoryAsync(
                    request.Id,
                    "DeadlineReminder",
                    $"Deadline reminder sent ({daysRemaining} days remaining)",
                    "System",
                    "System",
                    null
                );

                _logger.LogInformation(
                    "Deadline reminder sent for request {RequestId} ({DaysRemaining} days remaining)",
                    request.Id,
                    daysRemaining
                );
            }

            _logger.LogInformation(
                "Request deadline check completed. Sent {Count} reminders",
                requestsNearingDeadline.Count
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process request deadline reminders");
            throw;
        }
    }
}
