using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RentManager.API.Models;

/// <summary>
/// Tracks all actions taken on a data subject request
/// Provides complete audit trail for compliance
/// </summary>
public class DataSubjectRequestHistory
{
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// Related data subject request
    /// </summary>
    [Required]
    public int RequestId { get; set; }

    [ForeignKey(nameof(RequestId))]
    public virtual DataSubjectRequest Request { get; set; } = null!;

    /// <summary>
    /// Action taken: Created, StatusChanged, Assigned, IdentityVerified, Completed, Rejected, ExportGenerated, etc.
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string Action { get; set; } = string.Empty;

    /// <summary>
    /// Previous status (for StatusChanged actions)
    /// </summary>
    [MaxLength(50)]
    public string? OldStatus { get; set; }

    /// <summary>
    /// New status (for StatusChanged actions)
    /// </summary>
    [MaxLength(50)]
    public string? NewStatus { get; set; }

    /// <summary>
    /// Details or notes about the action
    /// </summary>
    [MaxLength(2000)]
    public string? Details { get; set; }

    /// <summary>
    /// Who performed the action (UserId or AdminId)
    /// </summary>
    [MaxLength(255)]
    public string? PerformedBy { get; set; }

    /// <summary>
    /// Role of who performed the action (User, Admin, System)
    /// </summary>
    [MaxLength(50)]
    public string? PerformedByRole { get; set; }

    /// <summary>
    /// When the action was performed
    /// </summary>
    [Required]
    public DateTimeOffset PerformedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// IP address from which the action was performed
    /// </summary>
    [MaxLength(45)]
    public string? IpAddress { get; set; }
}
