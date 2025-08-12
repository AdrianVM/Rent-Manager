using Microsoft.AspNetCore.Mvc;
using RentManager.API.Services;

namespace RentManager.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SeedController : ControllerBase
    {
        private readonly SeedDataService _seedDataService;

        public SeedController(SeedDataService seedDataService)
        {
            _seedDataService = seedDataService;
        }

        [HttpPost("demo-data")]
        public async Task<IActionResult> SeedDemoData()
        {
            try
            {
                await _seedDataService.SeedAllDataAsync();
                return Ok(new { message = "Demo data seeded successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to seed demo data", error = ex.Message });
            }
        }
    }
}