namespace RentManager.API.Models
{
    public class User
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastLoginAt { get; set; }

        // Navigation properties for role-specific data
        public string? TenantId { get; set; }  // For Renter role
        public List<string> PropertyIds { get; set; } = new List<string>();  // For PropertyOwner role

        // Navigation property for roles
        public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();

        // Helper methods for role management
        public bool HasRole(string roleName)
        {
            return UserRoles.Any(ur => ur.Role.Name == roleName);
        }

        public List<string> GetRoleNames()
        {
            return UserRoles.Select(ur => ur.Role.Name).ToList();
        }
    }

    // Legacy enum - kept for backward compatibility
    public enum LegacyUserRole
    {
        Renter,
        PropertyOwner,
        Admin
    }

    public class UserRegistrationRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public List<string> Roles { get; set; } = new List<string> { Role.Renter };
        public string? TenantId { get; set; }  // Optional for Renter role
    }

    public class UserLoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class UserLoginResponse
    {
        public string Token { get; set; } = string.Empty;
        public User User { get; set; } = new User();
    }

    public class UserUpdateRequest
    {
        public string? Name { get; set; }
        public string? Email { get; set; }
        public List<string>? Roles { get; set; }
        public bool? IsActive { get; set; }
        public string? TenantId { get; set; }
        public List<string>? PropertyIds { get; set; }
    }
}