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

        [HttpPost("login")]
        public async Task<ActionResult<UserLoginResponse>> Login([FromBody] UserLoginRequest request)
        {
            if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest("Email and password are required");
            }

            var response = await _authService.LoginAsync(request);
            if (response == null)
            {
                return Unauthorized("Invalid email or password");
            }

            return Ok(response);
        }

        [HttpPost("register")]
        public async Task<ActionResult<User>> Register([FromBody] UserRegistrationRequest request)
        {
            if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password) || string.IsNullOrEmpty(request.Name))
            {
                return BadRequest("Email, password, and name are required");
            }

            var user = await _authService.RegisterAsync(request);
            if (user == null)
            {
                return Conflict("User with this email already exists");
            }

            // Remove password hash from response
            user.PasswordHash = "";
            return Ok(user);
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

        [HttpPost("change-password")]
        [Authorize]
        public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var success = await _authService.ChangePasswordAsync(userId, request.CurrentPassword, request.NewPassword);
            if (!success)
            {
                return BadRequest("Current password is incorrect");
            }

            return Ok();
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

        [HttpPost("logout")]
        [Authorize]
        public Task<ActionResult> Logout()
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
            {
                return Task.FromResult<ActionResult>(Unauthorized());
            }

            // For now, just return success since we're using stateless JWT tokens
            // In a production app, you might want to maintain a blacklist of invalidated tokens
            return Task.FromResult<ActionResult>(Ok(new { message = "Logged out successfully" }));
        }

        private string? GetCurrentUserId()
        {
            return User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        }
    }

    public class ChangePasswordRequest
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}