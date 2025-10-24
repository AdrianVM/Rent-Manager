namespace RentManager.API.Models
{
    public class UserRole
    {
        public string UserId { get; set; } = string.Empty;
        public int RoleId { get; set; }
        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public User User { get; set; } = null!;
        public Role Role { get; set; } = null!;
    }
}
