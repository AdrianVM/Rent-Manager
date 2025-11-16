using RentManager.API.Services.DataRetention;

namespace RentManager.API.BackgroundJobs.Jobs
{
    /// <summary>
    /// Background job that generates weekly data retention compliance reports.
    /// Runs every Monday at 8:00 AM UTC.
    /// </summary>
    public class RetentionComplianceReportJob
    {
        private readonly IDataRetentionService _retentionService;
        private readonly ILegalHoldService _legalHoldService;
        private readonly ILogger<RetentionComplianceReportJob> _logger;

        public RetentionComplianceReportJob(
            IDataRetentionService retentionService,
            ILegalHoldService legalHoldService,
            ILogger<RetentionComplianceReportJob> logger)
        {
            _retentionService = retentionService;
            _legalHoldService = legalHoldService;
            _logger = logger;
        }

        /// <summary>
        /// Generates and sends a weekly compliance report.
        /// </summary>
        public async Task ExecuteAsync()
        {
            _logger.LogInformation("Starting weekly retention compliance report generation");

            try
            {
                var schedules = await _retentionService.GetActiveRetentionSchedulesAsync();
                var legalHolds = await _legalHoldService.GetActiveLegalHoldsAsync();
                var schedulesDueForReview = await _retentionService.GetSchedulesDueForReviewAsync(12);

                // Generate report summary
                var reportSummary = new
                {
                    GeneratedAt = DateTimeOffset.UtcNow,
                    ActiveRetentionSchedules = schedules.Count,
                    ActiveLegalHolds = legalHolds.Count,
                    SchedulesDueForReview = schedulesDueForReview.Count,
                    RetentionCategories = schedules.GroupBy(s => s.Action).Select(g => new
                    {
                        Action = g.Key.ToString(),
                        Count = g.Count()
                    })
                };

                _logger.LogInformation(
                    "Weekly compliance report generated: " +
                    "Active schedules: {ActiveSchedules}, " +
                    "Active legal holds: {ActiveHolds}, " +
                    "Schedules due for review: {DueForReview}",
                    reportSummary.ActiveRetentionSchedules,
                    reportSummary.ActiveLegalHolds,
                    reportSummary.SchedulesDueForReview);

                // In a full implementation, you would:
                // 1. Generate a detailed PDF/HTML report
                // 2. Email it to administrators
                // 3. Store it for audit purposes

                if (schedulesDueForReview.Any())
                {
                    _logger.LogWarning(
                        "ATTENTION: {Count} retention schedules are due for review",
                        schedulesDueForReview.Count);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating weekly retention compliance report");
                throw;
            }
        }
    }
}
