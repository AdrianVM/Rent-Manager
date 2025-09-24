using RentManager.API.Models;

namespace RentManager.API.Services
{
    public interface IAuthService
    {
        Task<UserLoginResponse?> LoginAsync(UserLoginRequest request);
        Task<User?> RegisterAsync(UserRegistrationRequest request);
        Task<User?> GetUserByIdAsync(string userId);
        Task<User?> GetUserByEmailAsync(string email);
        Task<User?> UpdateUserAsync(string userId, UserUpdateRequest request);
        Task<bool> DeleteUserAsync(string userId);
        Task<List<User>> GetUsersAsync();
        Task<bool> ChangePasswordAsync(string userId, string currentPassword, string newPassword);
        string GenerateJwtToken(User user);
        bool ValidatePassword(string password, string hash);
        string HashPassword(string password);
    }
}