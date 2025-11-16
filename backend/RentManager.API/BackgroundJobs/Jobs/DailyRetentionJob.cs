using RentManager.API.Services.DataRetention;

namespace RentManager.API.BackgroundJobs.Jobs
{
    /// <summary>
    /// Background job that executes data retention policies daily.
    /// Runs at 2:00 AM UTC to minimize impact on production systems.
    /// </summary>
    public class DailyRetentionJob
    {
        private readonly IAutomatedDeletionService _deletionService;
        private readonly ILogger<DailyRetentionJob> _logger;

        public DailyRetentionJob(
            IAutomatedDeletionService deletionService,
            ILogger<DailyRetentionJob> logger)
        {
            _deletionService = deletionService;
            _logger = logger;
        }

        /// <summary>
        /// Executes all retention policies.
        /// </summary>
        public async Task ExecuteAsync()
        {
            _logger.LogInformation("Starting daily retention job execution");

            try
            {
                var result = await _deletionService.ExecuteRetentionPoliciesAsync(dryRun: false);

                if (result.Success)
                {
                    _logger.LogInformation(
                        "Daily retention job completed successfully. " +
                        "Processed: {Processed}, Deleted: {Deleted}, Anonymized: {Anonymized}, " +
                        "Archived: {Archived}, Duration: {Duration}",
                        result.TotalRecordsProcessed,
                        result.TotalRecordsDeleted,
                        result.TotalRecordsAnonymized,
                        result.TotalRecordsArchived,
                        result.Duration);
                }
                else
                {
                    _logger.LogError(
                        "Daily retention job failed. Errors: {Errors}",
                        string.Join("; ", result.Errors));
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Fatal error during daily retention job execution");
                throw;
            }
        }

        /// <summary>
        /// Executes retention policies in dry-run mode (for testing).
        /// </summary>
        public async Task ExecuteDryRunAsync()
        {
            _logger.LogInformation("Starting daily retention job execution (DRY RUN)");

            try
            {
                var result = await _deletionService.ExecuteRetentionPoliciesAsync(dryRun: true);

                _logger.LogInformation(
                    "Daily retention job dry run completed. " +
                    "Would process: {Processed}, Would delete: {Deleted}, Would anonymize: {Anonymized}, " +
                    "Would archive: {Archived}",
                    result.TotalRecordsProcessed,
                    result.TotalRecordsDeleted,
                    result.TotalRecordsAnonymized,
                    result.TotalRecordsArchived);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during daily retention job dry run");
                throw;
            }
        }
    }
}
