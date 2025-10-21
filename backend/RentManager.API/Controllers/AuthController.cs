using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentManager.API.Models;
using RentManager.API.Services;

namespace RentManager.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult<User>> GetCurrentUser()
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var user = await _authService.GetUserByIdAsync(userId);
            if (user == null)
            {
                return NotFound();
            }

            // Remove password hash from response
            user.PasswordHash = "";
            return Ok(user);
        }

        [HttpPut("me")]
        [Authorize]
        public async Task<ActionResult<User>> UpdateCurrentUser([FromBody] UserUpdateRequest request)
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var user = await _authService.UpdateUserAsync(userId, request);
            if (user == null)
            {
                return NotFound();
            }

            // Remove password hash from response
            user.PasswordHash = "";
            return Ok(user);
        }

        [HttpGet("users")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<List<User>>> GetUsers()
        {
            var users = await _authService.GetUsersAsync();

            // Remove password hashes from response
            foreach (var user in users)
            {
                user.PasswordHash = "";
            }

            return Ok(users);
        }

        [HttpPut("users/{userId}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<User>> UpdateUser(string userId, [FromBody] UserUpdateRequest request)
        {
            var user = await _authService.UpdateUserAsync(userId, request);
            if (user == null)
            {
                return NotFound();
            }

            // Remove password hash from response
            user.PasswordHash = "";
            return Ok(user);
        }

        [HttpDelete("users/{userId}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> DeleteUser(string userId)
        {
            var success = await _authService.DeleteUserAsync(userId);
            if (!success)
            {
                return NotFound();
            }

            return NoContent();
        }

        private string? GetCurrentUserId()
        {
            // Try to get the user ID from Zitadel's "sub" claim first, then fall back to NameIdentifier
            return User.FindFirst("sub")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        }
    }
}
