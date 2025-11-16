using Microsoft.EntityFrameworkCore;
using RentManager.API.Data;
using RentManager.API.Models;

namespace RentManager.API.Services.DataRetention
{
    /// <summary>
    /// Service for managing legal holds on user data.
    /// Legal holds prevent data from being deleted during investigations or litigation.
    /// </summary>
    public class LegalHoldService : ILegalHoldService
    {
        private readonly RentManagerDbContext _context;
        private readonly ILogger<LegalHoldService> _logger;

        public LegalHoldService(
            RentManagerDbContext context,
            ILogger<LegalHoldService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<LegalHold> PlaceLegalHoldAsync(
            string userId,
            string? dataCategory,
            string reason,
            string placedBy,
            string? caseReference = null)
        {
            var hold = new LegalHold
            {
                UserId = userId,
                DataCategory = dataCategory,
                Reason = reason,
                PlacedBy = placedBy,
                PlacedAt = DateTimeOffset.UtcNow,
                IsActive = true,
                CaseReference = caseReference,
                ReviewDate = DateTimeOffset.UtcNow.AddMonths(3) // Default: review in 3 months
            };

            _context.LegalHolds.Add(hold);
            await _context.SaveChangesAsync();

            _logger.LogWarning(
                "Legal hold placed on user {UserId} {DataCategory} by {PlacedBy}. Reason: {Reason}",
                userId,
                dataCategory != null ? $"(category: {dataCategory})" : "(all data)",
                placedBy,
                reason);

            return hold;
        }

        public async Task<bool> ReleaseLegalHoldAsync(int holdId, string releasedBy, string releaseReason)
        {
            var hold = await _context.LegalHolds.FindAsync(holdId);
            if (hold == null || !hold.IsActive)
            {
                return false;
            }

            hold.IsActive = false;
            hold.ReleasedAt = DateTimeOffset.UtcNow;
            hold.ReleasedBy = releasedBy;
            hold.ReleaseReason = releaseReason;

            await _context.SaveChangesAsync();

            _logger.LogWarning(
                "Legal hold released for user {UserId} {DataCategory} by {ReleasedBy}. Reason: {ReleaseReason}",
                hold.UserId,
                hold.DataCategory != null ? $"(category: {hold.DataCategory})" : "(all data)",
                releasedBy,
                releaseReason);

            return true;
        }

        public async Task<bool> IsUserUnderLegalHoldAsync(string userId)
        {
            return await _context.LegalHolds
                .AnyAsync(h => h.UserId == userId && h.IsActive);
        }

        public async Task<bool> IsDataCategoryUnderLegalHoldAsync(string userId, string dataCategory)
        {
            return await _context.LegalHolds
                .AnyAsync(h => h.UserId == userId
                    && h.IsActive
                    && (h.DataCategory == null || h.DataCategory == dataCategory));
        }

        public async Task<List<LegalHold>> GetActiveLegalHoldsAsync()
        {
            return await _context.LegalHolds
                .Where(h => h.IsActive)
                .OrderBy(h => h.PlacedAt)
                .ToListAsync();
        }

        public async Task<List<LegalHold>> GetUserLegalHoldsAsync(string userId)
        {
            return await _context.LegalHolds
                .Where(h => h.UserId == userId)
                .OrderByDescending(h => h.PlacedAt)
                .ToListAsync();
        }

        public async Task<LegalHold?> GetLegalHoldByIdAsync(int id)
        {
            return await _context.LegalHolds.FindAsync(id);
        }

        public async Task<List<LegalHold>> GetHoldsDueForReviewAsync()
        {
            var now = DateTimeOffset.UtcNow;
            return await _context.LegalHolds
                .Where(h => h.IsActive && h.ReviewDate != null && h.ReviewDate <= now)
                .OrderBy(h => h.ReviewDate)
                .ToListAsync();
        }

        public async Task<bool> UpdateReviewDateAsync(int holdId, DateTimeOffset newReviewDate)
        {
            var hold = await _context.LegalHolds.FindAsync(holdId);
            if (hold == null)
            {
                return false;
            }

            hold.ReviewDate = newReviewDate;
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Updated review date for legal hold {HoldId} to {ReviewDate}",
                holdId, newReviewDate);

            return true;
        }

        public async Task<bool> AddNotesAsync(int holdId, string notes)
        {
            var hold = await _context.LegalHolds.FindAsync(holdId);
            if (hold == null)
            {
                return false;
            }

            hold.Notes = string.IsNullOrEmpty(hold.Notes)
                ? notes
                : $"{hold.Notes}\n---\n{notes}";

            await _context.SaveChangesAsync();

            _logger.LogInformation("Added notes to legal hold {HoldId}", holdId);

            return true;
        }
    }
}
