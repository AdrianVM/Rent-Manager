using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentManager.API.Models;
using RentManager.API.Services.DataSubject;
using System.Security.Claims;
using Hangfire;
using RentManager.API.DTOs.DataSubjectRequest;
using RentManager.API.Mappers;

namespace RentManager.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DataSubjectRequestController : ControllerBase
{
    private readonly IDataSubjectRequestService _requestService;
    private readonly IDataAccessService _dataAccessService;
    private readonly IDataDeletionService _dataDeletionService;
    private readonly IDataPortabilityService _dataPortabilityService;
    private readonly ILogger<DataSubjectRequestController> _logger;

    public DataSubjectRequestController(
        IDataSubjectRequestService requestService,
        IDataAccessService dataAccessService,
        IDataDeletionService dataDeletionService,
        IDataPortabilityService dataPortabilityService,
        ILogger<DataSubjectRequestController> logger)
    {
        _requestService = requestService;
        _dataAccessService = dataAccessService;
        _dataDeletionService = dataDeletionService;
        _dataPortabilityService = dataPortabilityService;
        _logger = logger;
    }

    /// <summary>
    /// Submit a new data subject request (Access, Deletion, Portability, Rectification, Restriction, Objection)
    /// </summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<DataSubjectRequestDto>> CreateRequest([FromBody] CreateDataSubjectRequestDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { message = "User ID not found in token" });
        }

        try
        {
            var request = await _requestService.CreateRequestAsync(
                userId,
                dto.RequestType,
                dto.Description,
                HttpContext.Connection.RemoteIpAddress?.ToString(),
                Request.Headers.UserAgent.ToString()
            );

            // For data access and portability requests, queue background job to generate export
            if (dto.RequestType == DataSubjectRequestType.Access ||
                dto.RequestType == DataSubjectRequestType.Portability)
            {
                BackgroundJob.Enqueue<RentManager.API.BackgroundJobs.Jobs.DataAccessRequestJob>(
                    job => job.ExecuteAsync(request.Id));
            }

            _logger.LogInformation(
                "Data subject request created. RequestId: {RequestId}, UserId: {UserId}, Type: {RequestType}",
                request.Id,
                userId,
                dto.RequestType
            );

            var result = request.ToDto();
            return CreatedAtAction(nameof(GetRequestById), new { id = request.Id }, result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get all requests for the current user
    /// </summary>
    [HttpGet("my-requests")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<List<DataSubjectRequestDto>>> GetMyRequests()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { message = "User ID not found in token" });
        }

        var requests = await _requestService.GetUserRequestsAsync(userId);
        return Ok(requests.ToDto());
    }

    /// <summary>
    /// Get a specific request by ID (user can only view their own requests)
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DataSubjectRequestDto>> GetRequestById(int id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { message = "User ID not found in token" });
        }

        // Non-admin users can only view their own requests
        var isAdmin = User.IsInRole("Admin");
        var request = await _requestService.GetRequestByIdAsync(id, isAdmin ? null : userId);

        if (request == null)
        {
            return NotFound(new { message = $"Request {id} not found" });
        }

        return Ok(request.ToDto());
    }

    /// <summary>
    /// Download data export for an access request
    /// </summary>
    [HttpGet("{id}/download")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status410Gone)]
    public async Task<ActionResult> DownloadExport(int id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { message = "User ID not found in token" });
        }

        var request = await _requestService.GetRequestByIdAsync(id, userId);

        if (request == null)
        {
            return NotFound(new { message = $"Request {id} not found" });
        }

        if (request.RequestType != DataSubjectRequestType.Access &&
            request.RequestType != DataSubjectRequestType.Portability)
        {
            return BadRequest(new { message = "Only access and portability requests have downloadable exports" });
        }

        if (string.IsNullOrEmpty(request.ExportFilePath))
        {
            return NotFound(new { message = "Export file not yet generated or not available" });
        }

        // Check if export has expired
        if (request.ExportExpiresAt.HasValue && request.ExportExpiresAt.Value < DateTimeOffset.UtcNow)
        {
            return StatusCode(410, new { message = "Export link has expired. Please submit a new request." });
        }

        // Check if file exists
        if (!System.IO.File.Exists(request.ExportFilePath))
        {
            return NotFound(new { message = "Export file not found on server" });
        }

        var fileBytes = await System.IO.File.ReadAllBytesAsync(request.ExportFilePath);
        var fileName = Path.GetFileName(request.ExportFilePath);

        return File(fileBytes, "application/json", fileName);
    }

    /// <summary>
    /// Preview what data categories will be deleted (for deletion requests)
    /// </summary>
    [HttpGet("deletion-preview")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult> GetDeletionPreview()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { message = "User ID not found in token" });
        }

        var deletable = await _dataDeletionService.IdentifyDeletableDataAsync(userId);
        var retainable = await _dataDeletionService.IdentifyRetainableDataAsync(userId);

        return Ok(new
        {
            deletable,
            retainable,
            warning = "Financial records and legal documents must be retained for 7 years per law"
        });
    }

    /// <summary>
    /// Preview what data categories exist for the user (for access requests)
    /// </summary>
    [HttpGet("data-categories")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult> GetDataCategories()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { message = "User ID not found in token" });
        }

        var categories = await _dataAccessService.GetUserDataCategoriesAsync(userId);

        return Ok(new { categories });
    }

    /// <summary>
    /// ADMIN ONLY: Get all pending requests
    /// </summary>
    [HttpGet("admin/pending")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<List<DataSubjectRequestDto>>> GetPendingRequests()
    {
        var requests = await _requestService.GetPendingRequestsAsync();
        return Ok(requests.ToDto());
    }

    /// <summary>
    /// ADMIN ONLY: Update request status
    /// </summary>
    [HttpPut("{id}/status")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DataSubjectRequestDto>> UpdateRequestStatus(
        int id,
        [FromBody] UpdateRequestStatusDto dto)
    {
        var adminId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(adminId))
        {
            return Unauthorized(new { message = "Admin ID not found in token" });
        }

        try
        {
            var request = await _requestService.UpdateRequestStatusAsync(
                id,
                dto.Status,
                dto.AdminNotes,
                adminId,
                "Admin"
            );

            // If completing a deletion request, execute the deletion
            if (dto.Status == DataSubjectRequestStatus.Completed &&
                request.RequestType == DataSubjectRequestType.Deletion)
            {
                var (deletionSummary, retentionSummary) = await _dataDeletionService.ExecuteDeletionAsync(
                    request.UserId,
                    adminId,
                    request.Id
                );

                request.DeletionSummary = deletionSummary;
                request.RetentionSummary = retentionSummary;

                // Update the request with deletion summaries
                await _requestService.UpdateRequestStatusAsync(
                    id,
                    DataSubjectRequestStatus.Completed,
                    $"Deletion completed. {deletionSummary}",
                    adminId,
                    "Admin"
                );
            }

            return Ok(request.ToDto());
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// ADMIN ONLY: Assign request to an admin
    /// </summary>
    [HttpPut("{id}/assign")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DataSubjectRequestDto>> AssignRequest(
        int id,
        [FromBody] AssignRequestDto dto)
    {
        var adminId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(adminId))
        {
            return Unauthorized(new { message = "Admin ID not found in token" });
        }

        try
        {
            var request = await _requestService.AssignRequestAsync(id, dto.AssignToAdminId, adminId);
            return Ok(request.ToDto());
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
