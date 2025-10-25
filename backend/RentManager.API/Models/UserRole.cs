namespace RentManager.API.Models
{
    public class UserRole
    {
        public string UserId { get; set; } = string.Empty;
        public int RoleId { get; set; }
        public DateTimeOffset AssignedAt { get; set; } = DateTimeOffset.UtcNow;

        // Navigation properties
        public User User { get; set; } = null!;
        public Role Role { get; set; } = null!;
    }
}
