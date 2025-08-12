using Microsoft.AspNetCore.Mvc;
using RentManager.API.Models;
using RentManager.API.Services;

namespace RentManager.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly IDataService _dataService;

        public DashboardController(IDataService dataService)
        {
            _dataService = dataService;
        }

        [HttpGet("stats")]
        public async Task<ActionResult<DashboardStats>> GetDashboardStats()
        {
            var stats = await _dataService.GetDashboardStatsAsync();
            return Ok(stats);
        }
    }
}