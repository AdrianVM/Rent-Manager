using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentManager.API.Models;
using RentManager.API.DTOs;
using RentManager.API.Services.DataRetention;

namespace RentManager.API.Controllers
{
    /// <summary>
    /// API endpoints for data retention policy management.
    /// Ultra-simplified model - admins execute retention policies manually via SQL scripts.
    /// Provides policy documentation and allows users to submit retention inquiries.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class DataRetentionController : ControllerBase
    {
        private readonly IDataRetentionService _retentionService;
        private readonly ILegalHoldService _legalHoldService;
        private readonly ILogger<DataRetentionController> _logger;

        public DataRetentionController(
            IDataRetentionService retentionService,
            ILegalHoldService legalHoldService,
            ILogger<DataRetentionController> logger)
        {
            _retentionService = retentionService;
            _legalHoldService = legalHoldService;
            _logger = logger;
        }

        /// <summary>
        /// Get all retention schedules (admin only).
        /// </summary>
        [HttpGet("schedules")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<List<DataRetentionSchedule>>> GetSchedules()
        {
            var schedules = await _retentionService.GetRetentionSchedulesAsync();
            return Ok(schedules);
        }

        /// <summary>
        /// Get a specific retention schedule by ID (admin only).
        /// </summary>
        [HttpGet("schedules/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<DataRetentionSchedule>> GetScheduleById(int id)
        {
            var schedule = await _retentionService.GetRetentionScheduleByIdAsync(id);
            if (schedule == null)
            {
                return NotFound(new { message = $"Retention schedule with ID {id} not found" });
            }

            return Ok(schedule);
        }

        /// <summary>
        /// Create a new retention schedule (admin only).
        /// </summary>
        [HttpPost("schedules")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<DataRetentionSchedule>> CreateSchedule([FromBody] CreateRetentionScheduleDto dto)
        {
            try
            {
                var schedule = new DataRetentionSchedule
                {
                    DataCategory = dto.DataCategory,
                    Description = dto.Description,
                    RetentionMonths = dto.RetentionMonths,
                    LegalBasis = dto.LegalBasis,
                    Action = dto.Action
                };

                var created = await _retentionService.CreateRetentionScheduleAsync(schedule);
                return CreatedAtAction(nameof(GetScheduleById), new { id = created.Id }, created);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Update an existing retention schedule (admin only).
        /// </summary>
        [HttpPut("schedules/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<DataRetentionSchedule>> UpdateSchedule(int id, [FromBody] UpdateRetentionScheduleDto dto)
        {
            try
            {
                var schedule = new DataRetentionSchedule
                {
                    Description = dto.Description,
                    RetentionMonths = dto.RetentionMonths,
                    LegalBasis = dto.LegalBasis,
                    Action = dto.Action,
                    IsActive = dto.IsActive,
                    ReviewedBy = dto.ReviewedBy
                };

                var updated = await _retentionService.UpdateRetentionScheduleAsync(id, schedule);
                return Ok(updated);
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Deactivate a retention schedule (admin only).
        /// </summary>
        [HttpPost("schedules/{id}/deactivate")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> DeactivateSchedule(int id)
        {
            var userId = User.FindFirst("sub")?.Value ?? "unknown";
            var success = await _retentionService.DeactivateRetentionScheduleAsync(id, userId);

            if (!success)
            {
                return NotFound(new { message = $"Retention schedule with ID {id} not found" });
            }

            return Ok(new { message = "Retention schedule deactivated successfully" });
        }

        /// <summary>
        /// Mark a retention schedule as reviewed (admin only).
        /// </summary>
        [HttpPost("schedules/{id}/mark-reviewed")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> MarkScheduleAsReviewed(int id)
        {
            var userId = User.FindFirst("sub")?.Value ?? "unknown";
            var success = await _retentionService.MarkScheduleAsReviewedAsync(id, userId);

            if (!success)
            {
                return NotFound(new { message = $"Retention schedule with ID {id} not found" });
            }

            return Ok(new { message = "Retention schedule marked as reviewed" });
        }

        /// <summary>
        /// Get retention schedules due for review (admin only).
        /// </summary>
        [HttpGet("schedules/due-for-review")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<List<DataRetentionSchedule>>> GetSchedulesDueForReview([FromQuery] int monthsSinceLastReview = 12)
        {
            var schedules = await _retentionService.GetSchedulesDueForReviewAsync(monthsSinceLastReview);
            return Ok(schedules);
        }

        /// <summary>
        /// Get retention compliance summary (admin only).
        /// </summary>
        [HttpGet("compliance")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<RetentionComplianceSummaryDto>> GetComplianceSummary()
        {
            var schedules = await _retentionService.GetActiveRetentionSchedulesAsync();
            var schedulesDueForReview = await _retentionService.GetSchedulesDueForReviewAsync(12);
            var legalHolds = await _legalHoldService.GetActiveLegalHoldsAsync();

            var summary = new RetentionComplianceSummaryDto
            {
                TotalActiveSchedules = schedules.Count,
                SchedulesDueForReview = schedulesDueForReview.Count,
                ActiveLegalHolds = legalHolds.Count,
                SchedulesByAction = schedules.GroupBy(s => s.Action.ToString())
                    .ToDictionary(g => g.Key, g => g.Count()),
                GeneratedAt = DateTimeOffset.UtcNow
            };

            return Ok(summary);
        }

        /// <summary>
        /// Get public retention policies (accessible to all authenticated users).
        /// Shows what data is retained and for how long.
        /// </summary>
        [HttpGet("policies")]
        [Authorize]
        public async Task<ActionResult<List<RetentionPolicyPublicDto>>> GetPublicPolicies()
        {
            var schedules = await _retentionService.GetActiveRetentionSchedulesAsync();

            var policies = schedules.Select(s => new RetentionPolicyPublicDto
            {
                DataCategory = s.DataCategory,
                Description = s.Description,
                RetentionMonths = s.RetentionMonths,
                RetentionPeriodDescription = s.RetentionMonths == 0
                    ? "Retained while your account is active"
                    : $"{s.RetentionMonths} months ({Math.Round(s.RetentionMonths / 12.0, 1)} years)",
                LegalBasis = s.LegalBasis,
                Action = s.Action.ToString(),
                ActionDescription = s.Action switch
                {
                    RetentionAction.Delete => "Permanently deleted",
                    RetentionAction.Anonymize => "Personally identifiable information removed",
                    RetentionAction.Archive => "Moved to secure long-term storage",
                    _ => "Unknown action"
                }
            }).ToList();

            return Ok(policies);
        }

        /// <summary>
        /// Get retention information for the current user (shows what data is kept and for how long).
        /// </summary>
        [HttpGet("my-retention-info")]
        [Authorize]
        public async Task<ActionResult<List<UserRetentionInfoDto>>> GetMyRetentionInfo()
        {
            var schedules = await _retentionService.GetActiveRetentionSchedulesAsync();

            var retentionInfo = schedules.Select(s => new UserRetentionInfoDto
            {
                DataCategory = s.DataCategory,
                Description = s.Description,
                RetentionMonths = s.RetentionMonths,
                RetentionPeriodDescription = s.RetentionMonths == 0
                    ? "Retained while your account is active"
                    : $"{s.RetentionMonths} months ({s.RetentionMonths / 12} years)",
                Action = s.Action,
                ActionDescription = s.Action switch
                {
                    RetentionAction.Delete => "Permanently deleted after retention period",
                    RetentionAction.Anonymize => "Anonymized (personally identifiable information removed)",
                    RetentionAction.Archive => "Archived in secure long-term storage",
                    _ => "Unknown action"
                }
            }).ToList();

            return Ok(retentionInfo);
        }
    }
}
