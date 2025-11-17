using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentManager.API.Data;
using RentManager.API.DTOs;
using RentManager.API.Models;
using System.Security.Claims;

namespace RentManager.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CookieConsentController : ControllerBase
{
    private readonly IUnitOfWork _context;
    private readonly ILogger<CookieConsentController> _logger;

    public CookieConsentController(
        IUnitOfWork context,
        ILogger<CookieConsentController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get current user's cookie consent preferences
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<CookieConsentResponse>> GetConsent([FromQuery] string? consentToken)
    {
        try
        {
            CookieConsent? consent = null;

            // Try to get authenticated user's consent first
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                consent = await _context.CookieConsents
                    .Where(c => c.UserId == userId && c.ExpiryDate > DateTimeOffset.UtcNow)
                    .OrderByDescending(c => c.LastUpdated)
                    .FirstOrDefaultAsync();
            }

            // If no user consent and consentToken provided, try anonymous consent
            if (consent == null && !string.IsNullOrEmpty(consentToken))
            {
                consent = await _context.CookieConsents
                    .Where(c => c.ConsentToken == consentToken && c.ExpiryDate > DateTimeOffset.UtcNow)
                    .OrderByDescending(c => c.LastUpdated)
                    .FirstOrDefaultAsync();
            }

            // Return default if no consent found
            if (consent == null)
            {
                return Ok(new CookieConsentResponse
                {
                    StrictlyNecessary = true,
                    Functional = false,
                    Performance = false,
                    Marketing = false,
                    ConsentDate = DateTimeOffset.UtcNow,
                    ExpiryDate = DateTimeOffset.UtcNow,
                    PolicyVersion = "1.0"
                });
            }

            return Ok(new CookieConsentResponse
            {
                StrictlyNecessary = consent.StrictlyNecessary,
                Functional = consent.Functional,
                Performance = consent.Performance,
                Marketing = consent.Marketing,
                ConsentDate = consent.ConsentDate,
                ExpiryDate = consent.ExpiryDate,
                PolicyVersion = consent.PolicyVersion
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving cookie consent");
            return StatusCode(500, "Error retrieving cookie consent preferences");
        }
    }

    /// <summary>
    /// Save or update cookie consent preferences
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<CookieConsentResponse>> SaveConsent([FromBody] SaveCookieConsentRequest request)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            var userAgent = HttpContext.Request.Headers["User-Agent"].ToString();

            CookieConsent? existingConsent = null;

            // Check for existing consent
            if (!string.IsNullOrEmpty(userId))
            {
                existingConsent = await _context.CookieConsents
                    .Where(c => c.UserId == userId)
                    .OrderByDescending(c => c.LastUpdated)
                    .FirstOrDefaultAsync();
            }
            else if (!string.IsNullOrEmpty(request.ConsentToken))
            {
                existingConsent = await _context.CookieConsents
                    .Where(c => c.ConsentToken == request.ConsentToken)
                    .OrderByDescending(c => c.LastUpdated)
                    .FirstOrDefaultAsync();
            }

            if (existingConsent != null)
            {
                // Update existing consent
                existingConsent.Functional = request.Functional;
                existingConsent.Performance = request.Performance;
                existingConsent.Marketing = request.Marketing;
                existingConsent.LastUpdated = DateTimeOffset.UtcNow;
                existingConsent.ExpiryDate = DateTimeOffset.UtcNow.AddYears(1);
                existingConsent.IpAddress = ipAddress;
                existingConsent.UserAgent = userAgent;

                _context.CookieConsents.Update(existingConsent);
            }
            else
            {
                // Create new consent
                var newConsentToken = string.IsNullOrEmpty(request.ConsentToken)
                    ? Guid.NewGuid().ToString()
                    : request.ConsentToken;

                var newConsent = new CookieConsent
                {
                    UserId = userId,
                    ConsentToken = string.IsNullOrEmpty(userId) ? newConsentToken : null,
                    StrictlyNecessary = true, // Always true
                    Functional = request.Functional,
                    Performance = request.Performance,
                    Marketing = request.Marketing,
                    ConsentDate = DateTimeOffset.UtcNow,
                    LastUpdated = DateTimeOffset.UtcNow,
                    ExpiryDate = DateTimeOffset.UtcNow.AddYears(1),
                    IpAddress = ipAddress,
                    UserAgent = userAgent,
                    PolicyVersion = "1.0"
                };

                _context.CookieConsents.Add(newConsent);
                existingConsent = newConsent;
            }

            await _context.SaveChangesAsync();

            return Ok(new CookieConsentResponse
            {
                StrictlyNecessary = existingConsent.StrictlyNecessary,
                Functional = existingConsent.Functional,
                Performance = existingConsent.Performance,
                Marketing = existingConsent.Marketing,
                ConsentDate = existingConsent.ConsentDate,
                ExpiryDate = existingConsent.ExpiryDate,
                PolicyVersion = existingConsent.PolicyVersion
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving cookie consent");
            return StatusCode(500, "Error saving cookie consent preferences");
        }
    }

    /// <summary>
    /// Withdraw all consent (except strictly necessary)
    /// </summary>
    [HttpPost("withdraw")]
    public async Task<ActionResult> WithdrawConsent([FromQuery] string? consentToken)
    {
        try
        {
            var request = new SaveCookieConsentRequest
            {
                Functional = false,
                Performance = false,
                Marketing = false,
                ConsentToken = consentToken
            };

            await SaveConsent(request);

            return Ok(new { message = "Cookie consent withdrawn successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error withdrawing cookie consent");
            return StatusCode(500, "Error withdrawing cookie consent");
        }
    }

    /// <summary>
    /// Get cookie policy information (public endpoint)
    /// </summary>
    [HttpGet("policy")]
    [AllowAnonymous]
    public ActionResult<object> GetCookiePolicy()
    {
        var policy = new
        {
            Version = "1.0",
            LastUpdated = "2025-11-13",
            Categories = new[]
            {
                new
                {
                    Name = "Strictly Necessary",
                    Key = "strictlyNecessary",
                    Required = true,
                    Description = "These cookies are essential for the application to function and cannot be disabled. They are usually only set in response to actions made by you such as logging in, setting your privacy preferences, or filling in forms.",
                    Cookies = new[]
                    {
                        new { Name = "oidc.user", Purpose = "OAuth/OpenID Connect authentication state", Duration = "Session" },
                        new { Name = "Authentication Session", Purpose = "Maintains your logged-in state", Duration = "Session" },
                        new { Name = "XSRF-TOKEN", Purpose = "Protection against cross-site request forgery attacks", Duration = "Session" }
                    }
                },
                new
                {
                    Name = "Functional",
                    Key = "functional",
                    Required = false,
                    Description = "These cookies enable enhanced functionality and personalization, such as remembering your preferences and settings. If you do not allow these cookies, some or all of these services may not function properly.",
                    Cookies = new[]
                    {
                        new { Name = "activeRole", Purpose = "Remembers your selected user role", Duration = "Persistent" },
                        new { Name = "rentManager_theme", Purpose = "Remembers your theme preference (light/dark mode)", Duration = "Persistent" }
                    }
                },
                new
                {
                    Name = "Performance",
                    Key = "performance",
                    Required = false,
                    Description = "These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our application. They help us understand which pages are the most and least popular and see how visitors move around the application.",
                    Cookies = new[]
                    {
                        new { Name = "Not currently used", Purpose = "Reserved for future analytics implementation", Duration = "N/A" }
                    }
                },
                new
                {
                    Name = "Marketing",
                    Key = "marketing",
                    Required = false,
                    Description = "These cookies may be set through our application by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant adverts on other sites.",
                    Cookies = new[]
                    {
                        new { Name = "Not currently used", Purpose = "Not currently implemented", Duration = "N/A" }
                    }
                }
            }
        };

        return Ok(policy);
    }
}
