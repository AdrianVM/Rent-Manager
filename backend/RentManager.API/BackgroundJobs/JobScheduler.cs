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
    /// Currently empty - add job configurations as needed
    /// </summary>
    public static void ConfigureRecurringJobs()
    {
        // Background jobs will be configured here
        // Example:
        // RecurringJob.AddOrUpdate<MyJob>(
        //     recurringJobId: "my-job-id",
        //     methodCall: job => job.ExecuteAsync(),
        //     cronExpression: Cron.Daily(9), // 9:00 AM daily
        //     options: new RecurringJobOptions
        //     {
        //         TimeZone = TimeZoneInfo.Utc,
        //         QueueName = "default"
        //     });
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
