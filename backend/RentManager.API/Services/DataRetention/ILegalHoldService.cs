using RentManager.API.Models;

namespace RentManager.API.Services.DataRetention
{
    /// <summary>
    /// Service interface for managing legal holds on user data.
    /// </summary>
    public interface ILegalHoldService
    {
        /// <summary>
        /// Places a legal hold on user data.
        /// </summary>
        Task<LegalHold> PlaceLegalHoldAsync(string userId, string? dataCategory, string reason, string placedBy, string? caseReference = null);

        /// <summary>
        /// Releases a legal hold.
        /// </summary>
        Task<bool> ReleaseLegalHoldAsync(int holdId, string releasedBy, string releaseReason);

        /// <summary>
        /// Checks if a user has any active legal holds.
        /// </summary>
        Task<bool> IsUserUnderLegalHoldAsync(string userId);

        /// <summary>
        /// Checks if a specific data category for a user is under legal hold.
        /// </summary>
        Task<bool> IsDataCategoryUnderLegalHoldAsync(string userId, string dataCategory);

        /// <summary>
        /// Gets all active legal holds.
        /// </summary>
        Task<List<LegalHold>> GetActiveLegalHoldsAsync();

        /// <summary>
        /// Gets all legal holds for a specific user.
        /// </summary>
        Task<List<LegalHold>> GetUserLegalHoldsAsync(string userId);

        /// <summary>
        /// Gets a specific legal hold by ID.
        /// </summary>
        Task<LegalHold?> GetLegalHoldByIdAsync(int id);

        /// <summary>
        /// Gets legal holds that are due for review.
        /// </summary>
        Task<List<LegalHold>> GetHoldsDueForReviewAsync();

        /// <summary>
        /// Updates the review date for a legal hold.
        /// </summary>
        Task<bool> UpdateReviewDateAsync(int holdId, DateTimeOffset newReviewDate);

        /// <summary>
        /// Adds notes to a legal hold.
        /// </summary>
        Task<bool> AddNotesAsync(int holdId, string notes);
    }
}
