using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentManager.API.Models;
using RentManager.API.DTOs;
using RentManager.API.Services.DataRetention;

namespace RentManager.API.Controllers
{
    /// <summary>
    /// API endpoints for legal hold management.
    /// Admin-only endpoints for placing, managing, and releasing legal holds on user data.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class LegalHoldController : ControllerBase
    {
        private readonly ILegalHoldService _legalHoldService;
        private readonly ILogger<LegalHoldController> _logger;

        public LegalHoldController(
            ILegalHoldService legalHoldService,
            ILogger<LegalHoldController> logger)
        {
            _legalHoldService = legalHoldService;
            _logger = logger;
        }

        /// <summary>
        /// Get all active legal holds.
        /// </summary>
        [HttpGet("active")]
        public async Task<ActionResult<List<LegalHold>>> GetActiveLegalHolds()
        {
            var holds = await _legalHoldService.GetActiveLegalHoldsAsync();
            return Ok(holds);
        }

        /// <summary>
        /// Get all legal holds for a specific user.
        /// </summary>
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<List<LegalHold>>> GetUserLegalHolds(string userId)
        {
            var holds = await _legalHoldService.GetUserLegalHoldsAsync(userId);
            return Ok(holds);
        }

        /// <summary>
        /// Get a specific legal hold by ID.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<LegalHold>> GetLegalHoldById(int id)
        {
            var hold = await _legalHoldService.GetLegalHoldByIdAsync(id);
            if (hold == null)
            {
                return NotFound(new { message = $"Legal hold with ID {id} not found" });
            }

            return Ok(hold);
        }

        /// <summary>
        /// Place a legal hold on user data.
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<LegalHold>> PlaceLegalHold([FromBody] PlaceLegalHoldDto dto)
        {
            var placedBy = User.FindFirst("sub")?.Value ?? "unknown";

            var hold = await _legalHoldService.PlaceLegalHoldAsync(
                userId: dto.UserId,
                dataCategory: dto.DataCategory,
                reason: dto.Reason,
                placedBy: placedBy,
                caseReference: dto.CaseReference);

            if (!string.IsNullOrEmpty(dto.Notes))
            {
                await _legalHoldService.AddNotesAsync(hold.Id, dto.Notes);
            }

            _logger.LogWarning(
                "Legal hold {HoldId} placed on user {UserId} by {PlacedBy}",
                hold.Id, dto.UserId, placedBy);

            return CreatedAtAction(nameof(GetLegalHoldById), new { id = hold.Id }, hold);
        }

        /// <summary>
        /// Release a legal hold.
        /// </summary>
        [HttpPost("{id}/release")]
        public async Task<ActionResult> ReleaseLegalHold(int id, [FromBody] ReleaseLegalHoldDto dto)
        {
            var releasedBy = User.FindFirst("sub")?.Value ?? "unknown";

            var success = await _legalHoldService.ReleaseLegalHoldAsync(id, releasedBy, dto.ReleaseReason);
            if (!success)
            {
                return NotFound(new { message = $"Legal hold with ID {id} not found or already released" });
            }

            _logger.LogWarning(
                "Legal hold {HoldId} released by {ReleasedBy}",
                id, releasedBy);

            return Ok(new { message = "Legal hold released successfully" });
        }

        /// <summary>
        /// Check if a user has any active legal holds.
        /// </summary>
        [HttpGet("check/{userId}")]
        public async Task<ActionResult<bool>> CheckUserLegalHold(string userId)
        {
            var hasHold = await _legalHoldService.IsUserUnderLegalHoldAsync(userId);
            return Ok(new { userId, hasActiveLegalHold = hasHold });
        }

        /// <summary>
        /// Get legal holds that are due for review.
        /// </summary>
        [HttpGet("due-for-review")]
        public async Task<ActionResult<List<LegalHold>>> GetHoldsDueForReview()
        {
            var holds = await _legalHoldService.GetHoldsDueForReviewAsync();
            return Ok(holds);
        }

        /// <summary>
        /// Update the review date for a legal hold.
        /// </summary>
        [HttpPut("{id}/review-date")]
        public async Task<ActionResult> UpdateReviewDate(int id, [FromBody] DateTimeOffset newReviewDate)
        {
            var success = await _legalHoldService.UpdateReviewDateAsync(id, newReviewDate);
            if (!success)
            {
                return NotFound(new { message = $"Legal hold with ID {id} not found" });
            }

            return Ok(new { message = "Review date updated successfully" });
        }

        /// <summary>
        /// Add notes to a legal hold.
        /// </summary>
        [HttpPost("{id}/notes")]
        public async Task<ActionResult> AddNotes(int id, [FromBody] string notes)
        {
            var success = await _legalHoldService.AddNotesAsync(id, notes);
            if (!success)
            {
                return NotFound(new { message = $"Legal hold with ID {id} not found" });
            }

            return Ok(new { message = "Notes added successfully" });
        }
    }
}
