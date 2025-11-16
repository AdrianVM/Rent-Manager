using Hangfire;

namespace RentManager.API.BackgroundJobs;

/// <summary>
/// Central configuration for all recurring background jobs
/// Call ConfigureRecurringJobs() once during application startup
/// </summary>
public static class JobScheduler
{
    /// <summary>
    /// Configure all recurring background jobs
    /// </summary>
    public static void ConfigureRecurringJobs()
    {
        // Phase 3: Data Retention & Legal Hold Jobs

        // Daily retention policy execution (runs at 2:00 AM UTC)
        RecurringJob.AddOrUpdate<Jobs.DailyRetentionJob>(
            recurringJobId: "daily-retention-policy",
            methodCall: job => job.ExecuteAsync(),
            cronExpression: Cron.Daily(2), // 2:00 AM daily
            options: new RecurringJobOptions
            {
                TimeZone = TimeZoneInfo.Utc,
                QueueName = "default"
            });

        // Weekly retention compliance report (runs every Monday at 8:00 AM UTC)
        RecurringJob.AddOrUpdate<Jobs.RetentionComplianceReportJob>(
            recurringJobId: "weekly-retention-compliance-report",
            methodCall: job => job.ExecuteAsync(),
            cronExpression: Cron.Weekly(DayOfWeek.Monday, 8), // Monday 8:00 AM
            options: new RecurringJobOptions
            {
                TimeZone = TimeZoneInfo.Utc,
                QueueName = "default"
            });

        // Monthly legal hold review reminders (runs on 1st of month at 9:00 AM UTC)
        RecurringJob.AddOrUpdate<Jobs.LegalHoldReminderJob>(
            recurringJobId: "monthly-legal-hold-reminders",
            methodCall: job => job.ExecuteAsync(),
            cronExpression: Cron.Monthly(1, 9), // 1st of month, 9:00 AM
            options: new RecurringJobOptions
            {
                TimeZone = TimeZoneInfo.Utc,
                QueueName = "default"
            });
    }

    /// <summary>
    /// Manually enqueue a fire-and-forget job (useful for testing or admin actions)
    /// Example: BackgroundJob.Enqueue<MyJob>(job => job.ExecuteAsync())
    /// </summary>
    /// <remarks>
    /// This is a placeholder. Use BackgroundJob.Enqueue directly when adding jobs.
    /// </remarks>
    public static void EnqueueJob()
    {
        // Placeholder - use BackgroundJob.Enqueue<TJob>(job => job.MethodName()) directly
    }

    /// <summary>
    /// Remove a recurring job by its ID
    /// </summary>
    /// <param name="jobId">The recurring job ID</param>
    public static void RemoveRecurringJob(string jobId)
    {
        RecurringJob.RemoveIfExists(jobId);
    }

    /// <summary>
    /// Trigger a recurring job immediately (in addition to its normal schedule)
    /// </summary>
    /// <param name="jobId">The recurring job ID</param>
    public static void TriggerRecurringJobNow(string jobId)
    {
        RecurringJob.TriggerJob(jobId);
    }
}
