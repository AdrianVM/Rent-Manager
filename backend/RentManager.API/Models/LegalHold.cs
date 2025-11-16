using System.ComponentModel.DataAnnotations;

namespace RentManager.API.Models
{
    /// <summary>
    /// Tracks legal holds on user data to prevent deletion during investigations or litigation.
    /// Data under legal hold is exempt from automatic deletion policies.
    /// </summary>
    public class LegalHold
    {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// User ID whose data is under hold
        /// </summary>
        [Required]
        [MaxLength(255)]
        public string UserId { get; set; } = string.Empty;

        /// <summary>
        /// Specific data category under hold (null = all user data)
        /// </summary>
        [MaxLength(100)]
        public string? DataCategory { get; set; }

        /// <summary>
        /// Reason for the legal hold
        /// </summary>
        [Required]
        [MaxLength(1000)]
        public string Reason { get; set; } = string.Empty;

        /// <summary>
        /// When the hold was placed
        /// </summary>
        [Required]
        public DateTimeOffset PlacedAt { get; set; } = DateTimeOffset.UtcNow;

        /// <summary>
        /// Admin user ID who placed the hold
        /// </summary>
        [Required]
        [MaxLength(255)]
        public string PlacedBy { get; set; } = string.Empty;

        /// <summary>
        /// When the hold was released (null if still active)
        /// </summary>
        public DateTimeOffset? ReleasedAt { get; set; }

        /// <summary>
        /// Admin user ID who released the hold
        /// </summary>
        [MaxLength(255)]
        public string? ReleasedBy { get; set; }

        /// <summary>
        /// Reason for releasing the hold
        /// </summary>
        [MaxLength(1000)]
        public string? ReleaseReason { get; set; }

        /// <summary>
        /// Is this hold currently active?
        /// </summary>
        [Required]
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// Case reference or ticket number
        /// </summary>
        [MaxLength(100)]
        public string? CaseReference { get; set; }

        /// <summary>
        /// Expected review date for this hold
        /// </summary>
        public DateTimeOffset? ReviewDate { get; set; }

        /// <summary>
        /// Additional notes
        /// </summary>
        [MaxLength(2000)]
        public string? Notes { get; set; }
    }
}
