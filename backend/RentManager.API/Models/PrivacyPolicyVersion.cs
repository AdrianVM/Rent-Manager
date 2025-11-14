using System.ComponentModel.DataAnnotations;

namespace RentManager.API.Models;

/// <summary>
/// Represents a version of the privacy policy
/// </summary>
public class PrivacyPolicyVersion
{
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// Version number (e.g., "1.0", "1.1", "2.0")
    /// </summary>
    [Required]
    [MaxLength(10)]
    public string Version { get; set; } = string.Empty;

    /// <summary>
    /// Full HTML content of the privacy policy
    /// </summary>
    [Required]
    public string ContentHtml { get; set; } = string.Empty;

    /// <summary>
    /// Plain text version for email notifications
    /// </summary>
    public string? ContentPlainText { get; set; }

    /// <summary>
    /// When this version becomes effective
    /// </summary>
    [Required]
    public DateTimeOffset EffectiveDate { get; set; }

    /// <summary>
    /// When this version was created in the system
    /// </summary>
    [Required]
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// User ID who created/published this version
    /// </summary>
    public string? CreatedBy { get; set; }

    /// <summary>
    /// Is this the currently active version?
    /// </summary>
    [Required]
    public bool IsCurrent { get; set; } = false;

    /// <summary>
    /// Is this a material change requiring re-acceptance?
    /// </summary>
    [Required]
    public bool RequiresReAcceptance { get; set; } = false;

    /// <summary>
    /// Summary of changes from previous version
    /// </summary>
    [MaxLength(2000)]
    public string? ChangesSummary { get; set; }

    /// <summary>
    /// Navigation property to user acceptances
    /// </summary>
    public virtual ICollection<UserPrivacyPolicyAcceptance> UserAcceptances { get; set; }
        = new List<UserPrivacyPolicyAcceptance>();
}
