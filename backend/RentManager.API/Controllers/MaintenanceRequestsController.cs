using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentManager.API.DTOs;
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
        public async Task<ActionResult<List<MaintenanceRequestDto>>> GetMaintenanceRequests()
        {
            var requests = await _dataService.GetMaintenanceRequestsAsync();
            var dtos = MaintenanceRequestMapper.ToDto(requests);
            return Ok(dtos);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<MaintenanceRequestDto>> GetMaintenanceRequest(string id)
        {
            var request = await _dataService.GetMaintenanceRequestAsync(id);
            if (request == null)
            {
                return NotFound();
            }
            var dto = MaintenanceRequestMapper.ToDto(request);
            return Ok(dto);
        }

        [HttpGet("tenant/{tenantId}")]
        public async Task<ActionResult<List<MaintenanceRequestDto>>> GetMaintenanceRequestsByTenant(string tenantId)
        {
            var requests = await _dataService.GetMaintenanceRequestsByTenantIdAsync(tenantId);
            var dtos = MaintenanceRequestMapper.ToDto(requests);
            return Ok(dtos);
        }

        [HttpGet("property/{propertyId}")]
        public async Task<ActionResult<List<MaintenanceRequestDto>>> GetMaintenanceRequestsByProperty(string propertyId)
        {
            var requests = await _dataService.GetMaintenanceRequestsByPropertyIdAsync(propertyId);
            var dtos = MaintenanceRequestMapper.ToDto(requests);
            return Ok(dtos);
        }

        [HttpPost]
        public async Task<ActionResult<MaintenanceRequestDto>> CreateMaintenanceRequest([FromBody] MaintenanceRequestCreateDto dto)
        {
            try
            {
                var entity = MaintenanceRequestMapper.ToEntity(dto);
                var createdRequest = await _dataService.CreateMaintenanceRequestAsync(entity);

                // Reload the request with all relationships
                var fullRequest = await _dataService.GetMaintenanceRequestAsync(createdRequest.Id);

                if (fullRequest == null)
                {
                    return BadRequest("Failed to retrieve created request");
                }

                var responseDto = MaintenanceRequestMapper.ToDto(fullRequest);
                return CreatedAtAction(nameof(GetMaintenanceRequest), new { id = createdRequest.Id }, responseDto);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error creating maintenance request: {ex.Message}");
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,PropertyOwner")]
        public async Task<ActionResult<MaintenanceRequestDto>> UpdateMaintenanceRequest(string id, [FromBody] MaintenanceRequestUpdateDto dto)
        {
            var existingRequest = await _dataService.GetMaintenanceRequestAsync(id);
            if (existingRequest == null)
            {
                return NotFound();
            }

            MaintenanceRequestMapper.UpdateEntity(existingRequest, dto);

            var updatedRequest = await _dataService.UpdateMaintenanceRequestAsync(id, existingRequest);
            if (updatedRequest == null)
            {
                return NotFound();
            }

            var responseDto = MaintenanceRequestMapper.ToDto(updatedRequest);
            return Ok(responseDto);
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
}
