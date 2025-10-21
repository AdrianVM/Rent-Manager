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
    }
}
