namespace RentManager.API.Models
{
    public class Role
    {
        // Role name constants
        public const string Admin = "Admin";
        public const string PropertyOwner = "PropertyOwner";
        public const string Renter = "Renter";

        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    }
}
