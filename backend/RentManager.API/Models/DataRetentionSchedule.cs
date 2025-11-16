using System.ComponentModel.DataAnnotations;

namespace RentManager.API.Models
{
    /// <summary>
    /// Defines retention policies for different data categories.
    /// Guides automated deletion jobs and documents legal justification.
    /// </summary>
    public class DataRetentionSchedule
    {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// Category of data (e.g., "user_accounts", "financial_records", "contracts")
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string DataCategory { get; set; } = string.Empty;

        /// <summary>
        /// Human-readable description of what data is included
        /// </summary>
        [Required]
        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;

        /// <summary>
        /// Retention period in months
        /// </summary>
        [Required]
        public int RetentionMonths { get; set; }

        /// <summary>
        /// Legal basis for retention (e.g., "Tax compliance", "Contract fulfillment")
        /// </summary>
        [Required]
        [MaxLength(500)]
        public string LegalBasis { get; set; } = string.Empty;

        /// <summary>
        /// What happens after retention period (Delete, Anonymize, Archive)
        /// </summary>
        [Required]
        public RetentionAction Action { get; set; }

        /// <summary>
        /// Is this policy currently active?
        /// </summary>
        [Required]
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// When this policy was created
        /// </summary>
        [Required]
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        /// <summary>
        /// Last time this policy was reviewed
        /// </summary>
        public DateTimeOffset? LastReviewedAt { get; set; }

        /// <summary>
        /// Who last reviewed this policy
        /// </summary>
        [MaxLength(255)]
        public string? ReviewedBy { get; set; }
    }

    public enum RetentionAction
    {
        Delete,      // Permanent deletion
        Anonymize,   // Remove PII, keep statistical data
        Archive      // Move to cold storage
    }
}
