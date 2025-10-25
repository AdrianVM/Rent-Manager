namespace RentManager.API.Models
{
    public class User
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastLoginAt { get; set; }

        // Navigation property to Person
        public string? PersonId { get; set; }
        public Person? Person { get; set; }

        // Navigation property for roles
        public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();

        // Computed property for display name from Person
        public string Name => Person != null
            ? $"{Person.FirstName} {Person.MiddleName} {Person.LastName}".Replace("  ", " ").Trim()
            : Email.Split('@')[0];

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
        public string FirstName { get; set; } = string.Empty;
        public string? MiddleName { get; set; }
        public string LastName { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public List<string> Roles { get; set; } = new List<string> { Role.Renter };
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
        public string? Email { get; set; }
        public string? FirstName { get; set; }
        public string? MiddleName { get; set; }
        public string? LastName { get; set; }
        public List<string>? Roles { get; set; }
        public bool? IsActive { get; set; }
    }
}