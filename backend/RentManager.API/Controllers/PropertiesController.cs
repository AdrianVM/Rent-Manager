using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentManager.API.Models;
using RentManager.API.Services;
using System.Security.Claims;

namespace RentManager.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PropertiesController : ControllerBase
    {
        private readonly IDataService _dataService;
        private readonly IAuthService _authService;

        public PropertiesController(IDataService dataService, IAuthService authService)
        {
            _dataService = dataService;
            _authService = authService;
        }

        [HttpGet]
        public async Task<ActionResult<List<Property>>> GetProperties()
        {
            var user = await GetCurrentUserAsync();
            var properties = await _dataService.GetPropertiesAsync(user);
            return Ok(properties);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Property>> GetProperty(string id)
        {
            var user = await GetCurrentUserAsync();
            var property = await _dataService.GetPropertyAsync(id, user);
            if (property == null)
            {
                return NotFound();
            }
            return Ok(property);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,PropertyOwner")]
        public async Task<ActionResult<Property>> CreateProperty(Property property)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await GetCurrentUserAsync();
            var createdProperty = await _dataService.CreatePropertyAsync(property, user);
            
            // If user is PropertyOwner, add property to their property list
            if (user != null && user.HasRole(Role.PropertyOwner))
            {
                user.PropertyIds.Add(createdProperty.Id);
                await _authService.UpdateUserAsync(user.Id, new UserUpdateRequest { PropertyIds = user.PropertyIds });
            }
            
            return CreatedAtAction(nameof(GetProperty), new { id = createdProperty.Id }, createdProperty);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,PropertyOwner")]
        public async Task<ActionResult<Property>> UpdateProperty(string id, Property property)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await GetCurrentUserAsync();
            var updatedProperty = await _dataService.UpdatePropertyAsync(id, property, user);
            if (updatedProperty == null)
            {
                return NotFound();
            }

            return Ok(updatedProperty);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,PropertyOwner")]
        public async Task<IActionResult> DeleteProperty(string id)
        {
            var user = await GetCurrentUserAsync();
            var success = await _dataService.DeletePropertyAsync(id, user);
            if (!success)
            {
                return NotFound();
            }

            return NoContent();
        }

        private async Task<User?> GetCurrentUserAsync()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return null;
            }
            return await _authService.GetUserByIdAsync(userId);
        }
    }
}