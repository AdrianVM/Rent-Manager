using System.ComponentModel.DataAnnotations;

namespace RentManager.API.Models;

/// <summary>
/// Logs all data deletion operations for compliance and audit purposes
/// Records what was deleted, when, by whom, and why
/// </summary>
public class DataDeletionLog
{
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// User ID whose data was deleted
    /// </summary>
    [Required]
    [MaxLength(255)]
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// Data category that was deleted (e.g., "profile", "payments", "audit_logs")
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string DataCategory { get; set; } = string.Empty;

    /// <summary>
    /// Description of what was deleted
    /// </summary>
    [MaxLength(2000)]
    public string? Description { get; set; }

    /// <summary>
    /// Number of records deleted in this category
    /// </summary>
    public int? RecordCount { get; set; }

    /// <summary>
    /// Deletion method: Deleted, Anonymized, Archived
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string DeletionMethod { get; set; } = "Deleted";

    /// <summary>
    /// Reason for deletion: UserRequest, RetentionPolicy, AdminAction, LegalObligation
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string Reason { get; set; } = string.Empty;

    /// <summary>
    /// Legal basis for deletion (GDPR article, retention policy, etc.)
    /// </summary>
    [MaxLength(500)]
    public string? LegalBasis { get; set; }

    /// <summary>
    /// When the deletion occurred
    /// </summary>
    [Required]
    public DateTimeOffset DeletedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// Who authorized/performed the deletion (UserId, AdminId, or "System")
    /// </summary>
    [MaxLength(255)]
    public string? DeletedBy { get; set; }

    /// <summary>
    /// Related data subject request ID (if deletion was due to user request)
    /// </summary>
    public int? RelatedRequestId { get; set; }

    /// <summary>
    /// IP address from which deletion was initiated (if applicable)
    /// </summary>
    [MaxLength(45)]
    public string? IpAddress { get; set; }

    /// <summary>
    /// Whether this deletion can be undone (for accidental deletions)
    /// </summary>
    [Required]
    public bool IsReversible { get; set; } = false;

    /// <summary>
    /// If reversible, location of backup data
    /// </summary>
    [MaxLength(500)]
    public string? BackupLocation { get; set; }
}
