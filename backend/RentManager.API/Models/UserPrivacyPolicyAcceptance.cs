using System.ComponentModel.DataAnnotations;

namespace RentManager.API.Models;

/// <summary>
/// Tracks when users accept each privacy policy version
/// </summary>
public class UserPrivacyPolicyAcceptance
{
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// User ID who accepted the policy
    /// </summary>
    [Required]
    [MaxLength(255)]
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// Foreign key to privacy policy version
    /// </summary>
    [Required]
    public int PolicyVersionId { get; set; }

    /// <summary>
    /// Navigation property to policy version
    /// </summary>
    public virtual PrivacyPolicyVersion PolicyVersion { get; set; } = null!;

    /// <summary>
    /// When the user accepted this version
    /// </summary>
    [Required]
    public DateTimeOffset AcceptedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// IP address when acceptance occurred (audit trail)
    /// </summary>
    [MaxLength(45)] // IPv6 max length
    public string? IpAddress { get; set; }

    /// <summary>
    /// User agent when acceptance occurred (audit trail)
    /// </summary>
    [MaxLength(500)]
    public string? UserAgent { get; set; }

    /// <summary>
    /// How the user accepted (e.g., "registration", "update_notification", "explicit_request")
    /// </summary>
    [MaxLength(50)]
    public string? AcceptanceMethod { get; set; }

    /// <summary>
    /// Optional: If user was shown a summary of changes
    /// </summary>
    public bool WasShownChangesSummary { get; set; } = false;
}
