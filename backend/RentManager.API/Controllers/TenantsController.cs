using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentManager.API.Models;
using RentManager.API.Services;

namespace RentManager.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TenantsController : ControllerBase
    {
        private readonly IDataService _dataService;

        public TenantsController(IDataService dataService)
        {
            _dataService = dataService;
        }

        [HttpGet]
        public async Task<ActionResult<List<Tenant>>> GetTenants(
            [FromQuery] TenantType? type = null,
            [FromQuery] TenantStatus? status = null)
        {
            var tenants = await _dataService.GetTenantsAsync();

            // Filter by tenant type if specified
            if (type.HasValue)
            {
                tenants = tenants.Where(t => t.TenantType == type.Value).ToList();
            }

            // Filter by status if specified
            if (status.HasValue)
            {
                tenants = tenants.Where(t => t.Status == status.Value).ToList();
            }

            return Ok(tenants);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Tenant>> GetTenant(string id)
        {
            var tenant = await _dataService.GetTenantAsync(id);
            if (tenant == null)
            {
                return NotFound();
            }
            return Ok(tenant);
        }

        [HttpPost]
        public async Task<ActionResult<Tenant>> CreateTenant(Tenant tenant)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var createdTenant = await _dataService.CreateTenantAsync(tenant);
            return CreatedAtAction(nameof(GetTenant), new { id = createdTenant.Id }, createdTenant);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<Tenant>> UpdateTenant(string id, Tenant tenant)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var updatedTenant = await _dataService.UpdateTenantAsync(id, tenant);
            if (updatedTenant == null)
            {
                return NotFound();
            }

            return Ok(updatedTenant);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTenant(string id)
        {
            var success = await _dataService.DeleteTenantAsync(id);
            if (!success)
            {
                return NotFound();
            }

            return NoContent();
        }
    }
}