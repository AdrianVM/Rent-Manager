using Microsoft.EntityFrameworkCore;
using RentManager.API.Data;
using RentManager.API.Models;

namespace RentManager.API.Services.DataRetention
{
    /// <summary>
    /// Service for managing data retention schedules.
    /// </summary>
    public class DataRetentionService : IDataRetentionService
    {
        private readonly RentManagerDbContext _context;
        private readonly ILogger<DataRetentionService> _logger;

        public DataRetentionService(
            RentManagerDbContext context,
            ILogger<DataRetentionService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<DataRetentionSchedule>> GetRetentionSchedulesAsync()
        {
            return await _context.DataRetentionSchedules
                .OrderBy(s => s.DataCategory)
                .ToListAsync();
        }

        public async Task<List<DataRetentionSchedule>> GetActiveRetentionSchedulesAsync()
        {
            return await _context.DataRetentionSchedules
                .Where(s => s.IsActive)
                .OrderBy(s => s.DataCategory)
                .ToListAsync();
        }

        public async Task<DataRetentionSchedule?> GetRetentionScheduleByIdAsync(int id)
        {
            return await _context.DataRetentionSchedules.FindAsync(id);
        }

        public async Task<DataRetentionSchedule?> GetRetentionPolicyForCategoryAsync(string dataCategory)
        {
            return await _context.DataRetentionSchedules
                .Where(s => s.DataCategory == dataCategory && s.IsActive)
                .FirstOrDefaultAsync();
        }

        public async Task<DataRetentionSchedule> CreateRetentionScheduleAsync(DataRetentionSchedule schedule)
        {
            // Validate that data category doesn't already exist
            var existing = await _context.DataRetentionSchedules
                .Where(s => s.DataCategory == schedule.DataCategory)
                .FirstOrDefaultAsync();

            if (existing != null)
            {
                throw new InvalidOperationException($"Retention schedule for data category '{schedule.DataCategory}' already exists.");
            }

            schedule.CreatedAt = DateTimeOffset.UtcNow;
            schedule.IsActive = true;

            _context.DataRetentionSchedules.Add(schedule);
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Created retention schedule for category '{DataCategory}' with {RetentionMonths} months retention",
                schedule.DataCategory, schedule.RetentionMonths);

            return schedule;
        }

        public async Task<DataRetentionSchedule> UpdateRetentionScheduleAsync(int id, DataRetentionSchedule schedule)
        {
            var existing = await _context.DataRetentionSchedules.FindAsync(id);
            if (existing == null)
            {
                throw new InvalidOperationException($"Retention schedule with ID {id} not found.");
            }

            // Update properties
            existing.Description = schedule.Description;
            existing.RetentionMonths = schedule.RetentionMonths;
            existing.LegalBasis = schedule.LegalBasis;
            existing.Action = schedule.Action;
            existing.IsActive = schedule.IsActive;
            existing.LastReviewedAt = DateTimeOffset.UtcNow;
            existing.ReviewedBy = schedule.ReviewedBy;

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Updated retention schedule for category '{DataCategory}' (ID: {Id})",
                existing.DataCategory, id);

            return existing;
        }

        public async Task<bool> DeactivateRetentionScheduleAsync(int id, string reviewedBy)
        {
            var schedule = await _context.DataRetentionSchedules.FindAsync(id);
            if (schedule == null)
            {
                return false;
            }

            schedule.IsActive = false;
            schedule.LastReviewedAt = DateTimeOffset.UtcNow;
            schedule.ReviewedBy = reviewedBy;

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Deactivated retention schedule for category '{DataCategory}' by {ReviewedBy}",
                schedule.DataCategory, reviewedBy);

            return true;
        }

        public async Task<bool> MarkScheduleAsReviewedAsync(int id, string reviewedBy)
        {
            var schedule = await _context.DataRetentionSchedules.FindAsync(id);
            if (schedule == null)
            {
                return false;
            }

            schedule.LastReviewedAt = DateTimeOffset.UtcNow;
            schedule.ReviewedBy = reviewedBy;

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Marked retention schedule for category '{DataCategory}' as reviewed by {ReviewedBy}",
                schedule.DataCategory, reviewedBy);

            return true;
        }

        public async Task<List<DataRetentionSchedule>> GetSchedulesDueForReviewAsync(int monthsSinceLastReview = 12)
        {
            var reviewDeadline = DateTimeOffset.UtcNow.AddMonths(-monthsSinceLastReview);

            return await _context.DataRetentionSchedules
                .Where(s => s.IsActive && (s.LastReviewedAt == null || s.LastReviewedAt < reviewDeadline))
                .OrderBy(s => s.LastReviewedAt ?? s.CreatedAt)
                .ToListAsync();
        }

        public async Task<DateTimeOffset?> CalculateRetentionDeadlineAsync(string dataCategory, DateTimeOffset createdAt)
        {
            var policy = await GetRetentionPolicyForCategoryAsync(dataCategory);
            if (policy == null)
            {
                _logger.LogWarning(
                    "No retention policy found for category '{DataCategory}'",
                    dataCategory);
                return null;
            }

            // If retention is 0, it means indefinite retention (or retained while active)
            if (policy.RetentionMonths == 0)
            {
                return null;
            }

            return createdAt.AddMonths(policy.RetentionMonths);
        }
    }
}
