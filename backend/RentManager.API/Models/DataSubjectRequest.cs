using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RentManager.API.Models;

/// <summary>
/// Represents a data subject request (GDPR Articles 15-22)
/// Includes access, deletion, portability, rectification, restriction, objection, and retention inquiries
/// </summary>
public class DataSubjectRequest
{
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// User ID who submitted the request
    /// </summary>
    [Required]
    [MaxLength(255)]
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// Type of request: Access, Deletion, Portability, Rectification, Restriction, Objection, RetentionInquiry
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string RequestType { get; set; } = string.Empty;

    /// <summary>
    /// Current status: Pending, InProgress, Completed, Rejected
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Pending";

    /// <summary>
    /// User's description or reason for the request
    /// </summary>
    [MaxLength(2000)]
    public string? Description { get; set; }

    /// <summary>
    /// When the request was submitted
    /// </summary>
    [Required]
    public DateTimeOffset SubmittedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// GDPR requires response within 30 days
    /// Calculated as SubmittedAt + 30 days
    /// </summary>
    [Required]
    public DateTimeOffset DeadlineAt { get; set; }

    /// <summary>
    /// When the request was completed (or rejected)
    /// </summary>
    public DateTimeOffset? CompletedAt { get; set; }

    /// <summary>
    /// IP address from which the request was submitted (for audit trail)
    /// </summary>
    [MaxLength(45)]
    public string? IpAddress { get; set; }

    /// <summary>
    /// User agent from which the request was submitted
    /// </summary>
    [MaxLength(500)]
    public string? UserAgent { get; set; }

    /// <summary>
    /// ID of admin who is handling/handled the request
    /// </summary>
    [MaxLength(255)]
    public string? AssignedToAdminId { get; set; }

    /// <summary>
    /// Admin's notes or reason for rejection
    /// </summary>
    [MaxLength(2000)]
    public string? AdminNotes { get; set; }

    /// <summary>
    /// For data export requests - path to generated file
    /// </summary>
    [MaxLength(500)]
    public string? ExportFilePath { get; set; }

    /// <summary>
    /// For data export requests - when the download link expires
    /// </summary>
    public DateTimeOffset? ExportExpiresAt { get; set; }

    /// <summary>
    /// For deletion requests - what was deleted (summary)
    /// </summary>
    [MaxLength(2000)]
    public string? DeletionSummary { get; set; }

    /// <summary>
    /// For deletion requests - what was retained and why
    /// </summary>
    [MaxLength(2000)]
    public string? RetentionSummary { get; set; }

    /// <summary>
    /// Indicates if identity was verified before processing
    /// </summary>
    [Required]
    public bool IdentityVerified { get; set; } = false;

    /// <summary>
    /// Method used for identity verification (e.g., "re-authentication", "admin-manual")
    /// </summary>
    [MaxLength(100)]
    public string? VerificationMethod { get; set; }

    /// <summary>
    /// When identity was verified
    /// </summary>
    public DateTimeOffset? VerifiedAt { get; set; }

    /// <summary>
    /// History entries for this request
    /// </summary>
    public virtual ICollection<DataSubjectRequestHistory> History { get; set; } = new List<DataSubjectRequestHistory>();
}

/// <summary>
/// Enum for request types (used for validation)
/// </summary>
public static class DataSubjectRequestType
{
    public const string Access = "Access";
    public const string Deletion = "Deletion";
    public const string Portability = "Portability";
    public const string Rectification = "Rectification";
    public const string Restriction = "Restriction";
    public const string Objection = "Objection";
    public const string RetentionInquiry = "RetentionInquiry";

    public static readonly string[] All = new[]
    {
        Access,
        Deletion,
        Portability,
        Rectification,
        Restriction,
        Objection,
        RetentionInquiry
    };
}

/// <summary>
/// Enum for request statuses
/// </summary>
public static class DataSubjectRequestStatus
{
    public const string Pending = "Pending";
    public const string InProgress = "InProgress";
    public const string Completed = "Completed";
    public const string Rejected = "Rejected";

    public static readonly string[] All = new[]
    {
        Pending,
        InProgress,
        Completed,
        Rejected
    };
}
