namespace RentManager.API.DTOs
{
    public class UserDto
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }

        // Person details
        public PersonDto? Person { get; set; }

        // Roles (simplified - just the role names)
        public List<string> Roles { get; set; } = new List<string>();

        // For compatibility with frontend expecting userRoles structure
        public List<UserRoleDto> UserRoles { get; set; } = new List<UserRoleDto>();
    }

    public class PersonDto
    {
        public string Id { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string? MiddleName { get; set; }
        public string LastName { get; set; } = string.Empty;
        public DateTime? DateOfBirth { get; set; }
        public string? IdNumber { get; set; }
        public string? Nationality { get; set; }
        public string? Occupation { get; set; }
    }

    public class UserRoleDto
    {
        public RoleDto Role { get; set; } = new RoleDto();
        public DateTime AssignedAt { get; set; }
    }

    public class RoleDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}
