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

        public class SeedDemoDataRequest
        {
            public string UserEmail { get; set; } = string.Empty;
        }

        [HttpPost("demo-data")]
        public async Task<IActionResult> SeedDemoData([FromBody] SeedDemoDataRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request?.UserEmail))
                {
                    return BadRequest(new { message = "User email is required" });
                }

                await _seedDataService.SeedAllDataAsync(request.UserEmail);
                return Ok(new { message = "Demo data seeded successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to seed demo data", error = ex.Message });
            }
        }
    }
}