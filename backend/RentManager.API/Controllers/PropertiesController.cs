using Microsoft.AspNetCore.Mvc;
using RentManager.API.Models;
using RentManager.API.Services;

namespace RentManager.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PropertiesController : ControllerBase
    {
        private readonly IDataService _dataService;

        public PropertiesController(IDataService dataService)
        {
            _dataService = dataService;
        }

        [HttpGet]
        public async Task<ActionResult<List<Property>>> GetProperties()
        {
            var properties = await _dataService.GetPropertiesAsync();
            return Ok(properties);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Property>> GetProperty(string id)
        {
            var property = await _dataService.GetPropertyAsync(id);
            if (property == null)
            {
                return NotFound();
            }
            return Ok(property);
        }

        [HttpPost]
        public async Task<ActionResult<Property>> CreateProperty(Property property)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var createdProperty = await _dataService.CreatePropertyAsync(property);
            return CreatedAtAction(nameof(GetProperty), new { id = createdProperty.Id }, createdProperty);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<Property>> UpdateProperty(string id, Property property)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var updatedProperty = await _dataService.UpdatePropertyAsync(id, property);
            if (updatedProperty == null)
            {
                return NotFound();
            }

            return Ok(updatedProperty);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProperty(string id)
        {
            var success = await _dataService.DeletePropertyAsync(id);
            if (!success)
            {
                return NotFound();
            }

            return NoContent();
        }
    }
}