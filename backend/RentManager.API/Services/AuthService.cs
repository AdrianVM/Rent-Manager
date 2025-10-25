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

            // Update Person details if provided
            if (user.Person != null)
            {
                if (!string.IsNullOrEmpty(request.FirstName))
                    user.Person.FirstName = request.FirstName;

                if (!string.IsNullOrEmpty(request.MiddleName))
                    user.Person.MiddleName = request.MiddleName;

                if (!string.IsNullOrEmpty(request.LastName))
                    user.Person.LastName = request.LastName;

                user.Person.UpdatedAt = DateTime.UtcNow;
            }

            if (!string.IsNullOrEmpty(request.Email))
                user.Email = request.Email;

            // Role updates should be handled separately through UserRoles relationship
            if (request.Roles != null && request.Roles.Any())
            {
                // TODO: Implement role updates in in-memory service if needed
            }

            if (request.IsActive.HasValue)
                user.IsActive = request.IsActive.Value;

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
