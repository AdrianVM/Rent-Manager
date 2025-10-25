using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentManager.API.Models;
using RentManager.API.Services;
using RentManager.API.DTOs;

namespace RentManager.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpGet("me")]
        public async Task<ActionResult<UserDto>> GetCurrentUser()
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

            return Ok(UserMapper.ToDto(user));
        }

        [HttpPut("me")]
        public async Task<ActionResult<UserDto>> UpdateCurrentUser([FromBody] UserUpdateRequest request)
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

            return Ok(UserMapper.ToDto(user));
        }

        [HttpGet("users")]
        public async Task<ActionResult<List<UserDto>>> GetUsers()
        {
            var users = await _authService.GetUsersAsync();
            return Ok(UserMapper.ToDto(users));
        }

        [HttpPut("users/{userId}")]
        public async Task<ActionResult<UserDto>> UpdateUser(string userId, [FromBody] UserUpdateRequest request)
        {
            var user = await _authService.UpdateUserAsync(userId, request);
            if (user == null)
            {
                return NotFound();
            }

            return Ok(UserMapper.ToDto(user));
        }

        [HttpDelete("users/{userId}")]
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
