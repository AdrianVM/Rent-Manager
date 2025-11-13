using System.ComponentModel.DataAnnotations;

namespace RentManager.API.Models;

/// <summary>
/// Represents a user's cookie consent preferences
/// </summary>
public class CookieConsent
{
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// User ID (optional - can track consent for anonymous users via ConsentToken)
    /// </summary>
    public string? UserId { get; set; }

    /// <summary>
    /// Anonymous consent token for non-authenticated users
    /// </summary>
    public string? ConsentToken { get; set; }

    /// <summary>
    /// Strictly necessary cookies (always true - cannot be disabled)
    /// </summary>
    public bool StrictlyNecessary { get; set; } = true;

    /// <summary>
    /// Functional cookies (remember preferences, settings)
    /// </summary>
    public bool Functional { get; set; } = false;

    /// <summary>
    /// Performance/Analytics cookies
    /// </summary>
    public bool Performance { get; set; } = false;

    /// <summary>
    /// Marketing/Targeting cookies
    /// </summary>
    public bool Marketing { get; set; } = false;

    /// <summary>
    /// When consent was given
    /// </summary>
    public DateTimeOffset ConsentDate { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// When consent was last updated
    /// </summary>
    public DateTimeOffset LastUpdated { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// IP address when consent was given (for audit purposes)
    /// </summary>
    public string? IpAddress { get; set; }

    /// <summary>
    /// User agent when consent was given (for audit purposes)
    /// </summary>
    public string? UserAgent { get; set; }

    /// <summary>
    /// Version of cookie policy accepted
    /// </summary>
    public string PolicyVersion { get; set; } = "1.0";

    /// <summary>
    /// Consent expires after 12 months (GDPR recommendation)
    /// </summary>
    public DateTimeOffset ExpiryDate { get; set; } = DateTimeOffset.UtcNow.AddYears(1);
}
