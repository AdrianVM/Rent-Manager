namespace RentManager.API.Services.DataRetention
{
    /// <summary>
    /// Service interface for automated data deletion based on retention policies.
    /// </summary>
    public interface IAutomatedDeletionService
    {
        /// <summary>
        /// Executes all retention policies (main entry point for background job).
        /// </summary>
        Task<RetentionExecutionResult> ExecuteRetentionPoliciesAsync(bool dryRun = false);

        /// <summary>
        /// Deletes expired cookie consents based on retention policy.
        /// </summary>
        Task<int> DeleteExpiredCookieConsentsAsync(bool dryRun = false);

        /// <summary>
        /// Deletes old audit logs based on retention policy.
        /// </summary>
        Task<int> DeleteExpiredAuditLogsAsync(bool dryRun = false);

        /// <summary>
        /// Anonymizes old payment records (keeps financial data but removes PII).
        /// </summary>
        Task<int> AnonymizeOldPaymentRecordsAsync(bool dryRun = false);

        /// <summary>
        /// Archives expired lease agreements.
        /// </summary>
        Task<int> ArchiveExpiredLeasesAsync(bool dryRun = false);

        /// <summary>
        /// Deletes inactive user accounts that haven't been accessed in the retention period.
        /// </summary>
        Task<int> DeleteInactiveAccountsAsync(bool dryRun = false);

        /// <summary>
        /// Deletes old email notification records.
        /// </summary>
        Task<int> DeleteOldEmailNotificationRecordsAsync(bool dryRun = false);

        /// <summary>
        /// Archives old privacy policy acceptance records.
        /// </summary>
        Task<int> ArchiveOldPrivacyPolicyAcceptancesAsync(bool dryRun = false);
    }

    /// <summary>
    /// Result of executing retention policies.
    /// </summary>
    public class RetentionExecutionResult
    {
        public bool Success { get; set; }
        public bool WasDryRun { get; set; }
        public DateTimeOffset ExecutedAt { get; set; }
        public int TotalRecordsProcessed { get; set; }
        public int TotalRecordsDeleted { get; set; }
        public int TotalRecordsAnonymized { get; set; }
        public int TotalRecordsArchived { get; set; }
        public int RecordsSkippedDueToLegalHold { get; set; }
        public Dictionary<string, int> ResultsByCategory { get; set; } = new();
        public List<string> Errors { get; set; } = new();
        public TimeSpan Duration { get; set; }
    }
}
