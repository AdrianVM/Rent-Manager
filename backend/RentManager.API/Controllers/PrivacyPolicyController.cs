using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentManager.API.Models;
using RentManager.API.Services;
using System.Security.Claims;

namespace RentManager.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PrivacyPolicyController : ControllerBase
{
    private readonly IPrivacyPolicyService _privacyPolicyService;

    public PrivacyPolicyController(IPrivacyPolicyService privacyPolicyService)
    {
        _privacyPolicyService = privacyPolicyService;
    }

    /// <summary>
    /// Get the current active privacy policy (public endpoint)
    /// </summary>
    [HttpGet("current")]
    [AllowAnonymous]
    public async Task<ActionResult<PrivacyPolicyVersion>> GetCurrentPolicy()
    {
        var policy = await _privacyPolicyService.GetCurrentPolicyAsync();
        if (policy == null)
        {
            return NotFound(new { message = "No active privacy policy found" });
        }

        return Ok(policy);
    }

    /// <summary>
    /// Get a specific policy version by ID (authenticated users only)
    /// </summary>
    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<PrivacyPolicyVersion>> GetPolicyVersion(int id)
    {
        var policy = await _privacyPolicyService.GetPolicyVersionAsync(id);
        if (policy == null)
        {
            return NotFound(new { message = "Privacy policy version not found" });
        }

        return Ok(policy);
    }

    /// <summary>
    /// Get all privacy policy versions (authenticated users only)
    /// </summary>
    [HttpGet("versions")]
    [Authorize]
    public async Task<ActionResult<List<PrivacyPolicyVersion>>> GetAllVersions()
    {
        var versions = await _privacyPolicyService.GetAllVersionsAsync();
        return Ok(versions);
    }

    /// <summary>
    /// Create a new privacy policy version (admin only)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<PrivacyPolicyVersion>> CreatePolicyVersion([FromBody] CreatePolicyVersionDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var policyVersion = new PrivacyPolicyVersion
        {
            Version = dto.Version,
            ContentHtml = dto.ContentHtml,
            ContentPlainText = dto.ContentPlainText,
            EffectiveDate = dto.EffectiveDate,
            IsCurrent = dto.IsCurrent,
            RequiresReAcceptance = dto.RequiresReAcceptance,
            ChangesSummary = dto.ChangesSummary,
            CreatedBy = userId,
            CreatedAt = DateTimeOffset.UtcNow
        };

        var createdPolicy = await _privacyPolicyService.CreatePolicyVersionAsync(policyVersion);

        return CreatedAtAction(
            nameof(GetPolicyVersion),
            new { id = createdPolicy.Id },
            createdPolicy
        );
    }

    /// <summary>
    /// Check if the current user needs to accept the privacy policy
    /// </summary>
    [HttpGet("acceptance-required")]
    [Authorize]
    public async Task<ActionResult<bool>> CheckAcceptanceRequired()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var required = await _privacyPolicyService.CheckUserAcceptanceRequiredAsync(userId);
        return Ok(new { acceptanceRequired = required });
    }

    /// <summary>
    /// Get the current user's privacy policy acceptance history
    /// </summary>
    [HttpGet("my-acceptances")]
    [Authorize]
    public async Task<ActionResult<List<UserPrivacyPolicyAcceptance>>> GetMyAcceptances()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var acceptances = await _privacyPolicyService.GetUserAcceptanceHistoryAsync(userId);
        return Ok(acceptances);
    }

    /// <summary>
    /// Record user's acceptance of the current privacy policy
    /// </summary>
    [HttpPost("accept")]
    [Authorize]
    public async Task<ActionResult<UserPrivacyPolicyAcceptance>> AcceptPolicy([FromBody] AcceptPolicyDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        // Get current policy if no specific version provided
        int policyVersionId = dto.PolicyVersionId;
        if (policyVersionId == 0)
        {
            var currentPolicy = await _privacyPolicyService.GetCurrentPolicyAsync();
            if (currentPolicy == null)
            {
                return NotFound(new { message = "No active privacy policy found" });
            }
            policyVersionId = currentPolicy.Id;
        }

        // Get IP address and user agent
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = Request.Headers["User-Agent"].ToString();

        var acceptance = await _privacyPolicyService.RecordAcceptanceAsync(
            userId,
            policyVersionId,
            ipAddress,
            userAgent,
            dto.AcceptanceMethod
        );

        return Ok(acceptance);
    }
}

// DTOs
public class CreatePolicyVersionDto
{
    public string Version { get; set; } = string.Empty;
    public string ContentHtml { get; set; } = string.Empty;
    public string? ContentPlainText { get; set; }
    public DateTimeOffset EffectiveDate { get; set; }
    public bool IsCurrent { get; set; }
    public bool RequiresReAcceptance { get; set; }
    public string? ChangesSummary { get; set; }
}

public class AcceptPolicyDto
{
    public int PolicyVersionId { get; set; }
    public string? AcceptanceMethod { get; set; }
}
