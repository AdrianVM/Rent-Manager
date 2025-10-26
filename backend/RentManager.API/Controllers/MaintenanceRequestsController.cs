using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentManager.API.Models;
using RentManager.API.Services;

namespace RentManager.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MaintenanceRequestsController : ControllerBase
    {
        private readonly IDataService _dataService;

        public MaintenanceRequestsController(IDataService dataService)
        {
            _dataService = dataService;
        }

        [HttpGet]
        public async Task<ActionResult<List<MaintenanceRequest>>> GetMaintenanceRequests()
        {
            var requests = await _dataService.GetMaintenanceRequestsAsync();
            return Ok(requests);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<MaintenanceRequest>> GetMaintenanceRequest(string id)
        {
            var request = await _dataService.GetMaintenanceRequestAsync(id);
            if (request == null)
            {
                return NotFound();
            }
            return Ok(request);
        }

        [HttpGet("tenant/{tenantId}")]
        public async Task<ActionResult<List<MaintenanceRequest>>> GetMaintenanceRequestsByTenant(string tenantId)
        {
            var requests = await _dataService.GetMaintenanceRequestsByTenantIdAsync(tenantId);
            return Ok(requests);
        }

        [HttpGet("property/{propertyId}")]
        public async Task<ActionResult<List<MaintenanceRequest>>> GetMaintenanceRequestsByProperty(string propertyId)
        {
            var requests = await _dataService.GetMaintenanceRequestsByPropertyIdAsync(propertyId);
            return Ok(requests);
        }

        [HttpPost]
        public async Task<ActionResult<MaintenanceRequest>> CreateMaintenanceRequest([FromBody] MaintenanceRequestCreateRequest request)
        {
            try
            {
                var maintenanceRequest = new MaintenanceRequest
                {
                    TenantId = request.TenantId,
                    PropertyId = request.PropertyId,
                    Title = request.Title,
                    Description = request.Description,
                    Priority = request.Priority,
                    Status = MaintenanceStatus.Pending
                };

                var createdRequest = await _dataService.CreateMaintenanceRequestAsync(maintenanceRequest);
                return CreatedAtAction(nameof(GetMaintenanceRequest), new { id = createdRequest.Id }, createdRequest);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error creating maintenance request: {ex.Message}");
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,PropertyOwner")]
        public async Task<ActionResult<MaintenanceRequest>> UpdateMaintenanceRequest(string id, [FromBody] MaintenanceRequestUpdateRequest request)
        {
            var existingRequest = await _dataService.GetMaintenanceRequestAsync(id);
            if (existingRequest == null)
            {
                return NotFound();
            }

            existingRequest.Title = request.Title;
            existingRequest.Description = request.Description;
            existingRequest.Status = request.Status;
            existingRequest.Priority = request.Priority;
            existingRequest.AssignedTo = request.AssignedTo;
            existingRequest.ResolutionNotes = request.ResolutionNotes;

            if (request.Status == MaintenanceStatus.Completed && existingRequest.ResolvedAt == null)
            {
                existingRequest.ResolvedAt = DateTimeOffset.UtcNow;
            }

            var updatedRequest = await _dataService.UpdateMaintenanceRequestAsync(id, existingRequest);
            return Ok(updatedRequest);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,PropertyOwner")]
        public async Task<ActionResult> DeleteMaintenanceRequest(string id)
        {
            var result = await _dataService.DeleteMaintenanceRequestAsync(id);
            if (!result)
            {
                return NotFound();
            }
            return NoContent();
        }
    }

    public class MaintenanceRequestCreateRequest
    {
        public string TenantId { get; set; } = string.Empty;
        public string PropertyId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public MaintenancePriority Priority { get; set; } = MaintenancePriority.Medium;
    }

    public class MaintenanceRequestUpdateRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public MaintenanceStatus Status { get; set; }
        public MaintenancePriority Priority { get; set; }
        public string? AssignedTo { get; set; }
        public string? ResolutionNotes { get; set; }
    }
}
