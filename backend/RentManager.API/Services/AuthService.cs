using RentManager.API.Models;
using RentManager.API.Data;

namespace RentManager.API.Services
{
    public class AuthService : IAuthService
    {
        private readonly PostgresDataService _postgresDataService;
        private readonly IConfiguration _configuration;

        public AuthService(IDataService dataService, IConfiguration configuration)
        {
            _postgresDataService = dataService as PostgresDataService
                ?? throw new ArgumentException("AuthService requires PostgresDataService");
            _configuration = configuration;
        }

        public async Task<User?> GetUserByIdAsync(string userId)
        {
            return await _postgresDataService.GetUserByIdAsync(userId);
        }

        public async Task<User?> GetUserByEmailAsync(string email)
        {
            return await _postgresDataService.GetUserByEmailAsync(email);
        }

        public async Task<User?> UpdateUserAsync(string userId, UserUpdateRequest request)
        {
            return await _postgresDataService.UpdateUserAsync(userId, request);
        }

        public async Task<bool> DeleteUserAsync(string userId)
        {
            return await _postgresDataService.DeleteUserAsync(userId);
        }

        public async Task<List<User>> GetUsersAsync()
        {
            return await _postgresDataService.GetAllUsersAsync();
        }
    }
}
