using RentManager.API.Services.DataRetention;

namespace RentManager.API.BackgroundJobs.Jobs
{
    /// <summary>
    /// Background job that sends reminders for legal holds due for review.
    /// Runs on the 1st of every month at 9:00 AM UTC.
    /// </summary>
    public class LegalHoldReminderJob
    {
        private readonly ILegalHoldService _legalHoldService;
        private readonly ILogger<LegalHoldReminderJob> _logger;

        public LegalHoldReminderJob(
            ILegalHoldService legalHoldService,
            ILogger<LegalHoldReminderJob> logger)
        {
            _legalHoldService = legalHoldService;
            _logger = logger;
        }

        /// <summary>
        /// Checks for legal holds that are due for review and sends reminders.
        /// </summary>
        public async Task ExecuteAsync()
        {
            _logger.LogInformation("Starting legal hold review reminder job");

            try
            {
                var holdsDueForReview = await _legalHoldService.GetHoldsDueForReviewAsync();

                if (!holdsDueForReview.Any())
                {
                    _logger.LogInformation("No legal holds are currently due for review");
                    return;
                }

                _logger.LogWarning(
                    "Found {Count} legal holds due for review",
                    holdsDueForReview.Count);

                foreach (var hold in holdsDueForReview)
                {
                    _logger.LogWarning(
                        "Legal hold #{HoldId} for user {UserId} is due for review. " +
                        "Placed: {PlacedAt}, Review date: {ReviewDate}, " +
                        "Case: {CaseReference}",
                        hold.Id,
                        hold.UserId,
                        hold.PlacedAt,
                        hold.ReviewDate,
                        hold.CaseReference ?? "N/A");

                    // In a full implementation, you would:
                    // 1. Send email notification to admin who placed the hold
                    // 2. Send email to compliance team
                    // 3. Create a task in admin dashboard
                }

                // Send summary email to administrators
                _logger.LogInformation(
                    "Legal hold review reminders processed for {Count} holds",
                    holdsDueForReview.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing legal hold review reminders");
                throw;
            }
        }
    }
}
