using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using RentManager.API.Models;

namespace RentManager.API.Services
{
    public class AuthService : IAuthService
    {
        private readonly IDataService _dataService;
        private readonly IConfiguration _configuration;
        private readonly Dictionary<string, User> _users = new();

        public AuthService(IDataService dataService, IConfiguration configuration)
        {
            _dataService = dataService;
            _configuration = configuration;
            SeedDefaultUsers();
        }

        private void SeedDefaultUsers()
        {
            var adminUser = new User
            {
                Id = "admin-1",
                Email = "admin@rentmanager.com",
                Name = "System Administrator",
                PasswordHash = HashPassword("admin123"),
                Role = UserRole.Admin,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var propertyOwnerUser = new User
            {
                Id = "owner-1",
                Email = "owner@rentmanager.com",
                Name = "Property Owner",
                PasswordHash = HashPassword("owner123"),
                Role = UserRole.PropertyOwner,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var renterUser = new User
            {
                Id = "renter-1",
                Email = "renter@rentmanager.com",
                Name = "John Doe",
                PasswordHash = HashPassword("renter123"),
                Role = UserRole.Renter,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                TenantId = "tenant-1"
            };

            _users[adminUser.Id] = adminUser;
            _users[propertyOwnerUser.Id] = propertyOwnerUser;
            _users[renterUser.Id] = renterUser;
        }

        public async Task<UserLoginResponse?> LoginAsync(UserLoginRequest request)
        {
            var user = await GetUserByEmailAsync(request.Email);
            if (user == null || !user.IsActive || !ValidatePassword(request.Password, user.PasswordHash))
            {
                return null;
            }

            user.LastLoginAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;

            var token = GenerateJwtToken(user);
            
            return new UserLoginResponse
            {
                Token = token,
                User = user
            };
        }

        public async Task<User?> RegisterAsync(UserRegistrationRequest request)
        {
            if (await GetUserByEmailAsync(request.Email) != null)
            {
                return null; // User already exists
            }

            var user = new User
            {
                Id = Guid.NewGuid().ToString(),
                Email = request.Email,
                Name = request.Name,
                PasswordHash = HashPassword(request.Password),
                Role = request.Role,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                TenantId = request.TenantId
            };

            _users[user.Id] = user;
            return user;
        }

        public async Task<User?> GetUserByIdAsync(string userId)
        {
            _users.TryGetValue(userId, out var user);
            return await Task.FromResult(user);
        }

        public async Task<User?> GetUserByEmailAsync(string email)
        {
            var user = _users.Values.FirstOrDefault(u => u.Email.Equals(email, StringComparison.OrdinalIgnoreCase));
            return await Task.FromResult(user);
        }

        public async Task<User?> UpdateUserAsync(string userId, UserUpdateRequest request)
        {
            if (!_users.TryGetValue(userId, out var user))
            {
                return null;
            }

            if (!string.IsNullOrEmpty(request.Name))
                user.Name = request.Name;
            
            if (!string.IsNullOrEmpty(request.Email))
                user.Email = request.Email;
            
            if (request.Role.HasValue)
                user.Role = request.Role.Value;
            
            if (request.IsActive.HasValue)
                user.IsActive = request.IsActive.Value;
            
            if (!string.IsNullOrEmpty(request.TenantId))
                user.TenantId = request.TenantId;
            
            if (request.PropertyIds != null)
                user.PropertyIds = request.PropertyIds;

            user.UpdatedAt = DateTime.UtcNow;

            return await Task.FromResult(user);
        }

        public async Task<bool> DeleteUserAsync(string userId)
        {
            var removed = _users.Remove(userId);
            return await Task.FromResult(removed);
        }

        public async Task<List<User>> GetUsersAsync()
        {
            return await Task.FromResult(_users.Values.ToList());
        }

        public async Task<bool> ChangePasswordAsync(string userId, string currentPassword, string newPassword)
        {
            if (!_users.TryGetValue(userId, out var user))
            {
                return false;
            }

            if (!ValidatePassword(currentPassword, user.PasswordHash))
            {
                return false;
            }

            user.PasswordHash = HashPassword(newPassword);
            user.UpdatedAt = DateTime.UtcNow;

            return await Task.FromResult(true);
        }

        public string GenerateJwtToken(User user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"] ?? "your-super-secret-key-that-is-at-least-32-characters-long";
            var issuer = jwtSettings["Issuer"] ?? "RentManager";
            var audience = jwtSettings["Audience"] ?? "RentManager";

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role.ToString()),
                new Claim("TenantId", user.TenantId ?? ""),
                new Claim("PropertyIds", string.Join(",", user.PropertyIds))
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public bool ValidatePassword(string password, string hash)
        {
            return BCrypt.Net.BCrypt.Verify(password, hash);
        }

        public string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }
    }
}