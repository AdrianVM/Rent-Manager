using System.ComponentModel.DataAnnotations;

namespace RentManager.API.Models.DTOs
{
    /// <summary>
    /// DTO for creating a new retention schedule.
    /// </summary>
    public class CreateRetentionScheduleDto
    {
        [Required]
        [MaxLength(100)]
        public string DataCategory { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [Range(0, 360)]
        public int RetentionMonths { get; set; }

        [Required]
        [MaxLength(500)]
        public string LegalBasis { get; set; } = string.Empty;

        [Required]
        public RetentionAction Action { get; set; }
    }

    /// <summary>
    /// DTO for updating an existing retention schedule.
    /// </summary>
    public class UpdateRetentionScheduleDto
    {
        [Required]
        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [Range(0, 360)]
        public int RetentionMonths { get; set; }

        [Required]
        [MaxLength(500)]
        public string LegalBasis { get; set; } = string.Empty;

        [Required]
        public RetentionAction Action { get; set; }

        public bool IsActive { get; set; } = true;

        [MaxLength(255)]
        public string? ReviewedBy { get; set; }
    }

    /// <summary>
    /// DTO for placing a legal hold.
    /// </summary>
    public class PlaceLegalHoldDto
    {
        [Required]
        [MaxLength(255)]
        public string UserId { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? DataCategory { get; set; }

        [Required]
        [MaxLength(1000)]
        public string Reason { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? CaseReference { get; set; }

        [MaxLength(2000)]
        public string? Notes { get; set; }
    }

    /// <summary>
    /// DTO for releasing a legal hold.
    /// </summary>
    public class ReleaseLegalHoldDto
    {
        [Required]
        [MaxLength(1000)]
        public string ReleaseReason { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO for retention information shown to users.
    /// </summary>
    public class UserRetentionInfoDto
    {
        public string DataCategory { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int RetentionMonths { get; set; }
        public string RetentionPeriodDescription { get; set; } = string.Empty;
        public RetentionAction Action { get; set; }
        public string ActionDescription { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO for retention compliance summary.
    /// </summary>
    public class RetentionComplianceSummaryDto
    {
        public int TotalActiveSchedules { get; set; }
        public int SchedulesDueForReview { get; set; }
        public int ActiveLegalHolds { get; set; }
        public Dictionary<string, int> SchedulesByAction { get; set; } = new();
        public DateTimeOffset GeneratedAt { get; set; }
    }
}
