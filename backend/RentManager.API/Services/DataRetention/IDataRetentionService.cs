using RentManager.API.Models;

namespace RentManager.API.Services.DataRetention
{
    /// <summary>
    /// Service interface for managing data retention schedules.
    /// </summary>
    public interface IDataRetentionService
    {
        /// <summary>
        /// Retrieves all retention schedules.
        /// </summary>
        Task<List<DataRetentionSchedule>> GetRetentionSchedulesAsync();

        /// <summary>
        /// Retrieves active retention schedules only.
        /// </summary>
        Task<List<DataRetentionSchedule>> GetActiveRetentionSchedulesAsync();

        /// <summary>
        /// Retrieves a specific retention schedule by ID.
        /// </summary>
        Task<DataRetentionSchedule?> GetRetentionScheduleByIdAsync(int id);

        /// <summary>
        /// Retrieves retention policy for a specific data category.
        /// </summary>
        Task<DataRetentionSchedule?> GetRetentionPolicyForCategoryAsync(string dataCategory);

        /// <summary>
        /// Creates a new retention schedule.
        /// </summary>
        Task<DataRetentionSchedule> CreateRetentionScheduleAsync(DataRetentionSchedule schedule);

        /// <summary>
        /// Updates an existing retention schedule.
        /// </summary>
        Task<DataRetentionSchedule> UpdateRetentionScheduleAsync(int id, DataRetentionSchedule schedule);

        /// <summary>
        /// Deactivates a retention schedule (doesn't delete it for audit trail).
        /// </summary>
        Task<bool> DeactivateRetentionScheduleAsync(int id, string reviewedBy);

        /// <summary>
        /// Marks a retention schedule as reviewed.
        /// </summary>
        Task<bool> MarkScheduleAsReviewedAsync(int id, string reviewedBy);

        /// <summary>
        /// Gets retention schedules that haven't been reviewed in the specified months.
        /// </summary>
        Task<List<DataRetentionSchedule>> GetSchedulesDueForReviewAsync(int monthsSinceLastReview = 12);

        /// <summary>
        /// Calculates the retention deadline for a specific data category.
        /// </summary>
        Task<DateTimeOffset?> CalculateRetentionDeadlineAsync(string dataCategory, DateTimeOffset createdAt);
    }
}
