using RentManager.API.Models;

namespace RentManager.API.Services
{
    public interface IAuthService
    {
        Task<User?> GetUserByIdAsync(string userId);
        Task<User?> GetUserByEmailAsync(string email);
        Task<User?> UpdateUserAsync(string userId, UserUpdateRequest request);
        Task<bool> DeleteUserAsync(string userId);
        Task<List<User>> GetUsersAsync();
    }
}
