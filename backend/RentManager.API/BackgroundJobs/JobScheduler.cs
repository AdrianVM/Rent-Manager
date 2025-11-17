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
    /// NOTE: Phase 3 automated retention jobs removed - retention is now executed manually by admins
    /// </summary>
    public static void ConfigureRecurringJobs()
    {
        // Placeholder for future recurring jobs
        // Use RecurringJob.AddOrUpdate<TJob>(...) to add jobs here
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
