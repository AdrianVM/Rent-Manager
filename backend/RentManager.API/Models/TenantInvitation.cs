namespace RentManager.API.Models
{
    public class TenantInvitation
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string PropertyId { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string InvitationToken { get; set; } = Guid.NewGuid().ToString();
        public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddDays(7);
        public InvitationStatus Status { get; set; } = InvitationStatus.Pending;
        public string? InvitedByUserId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Pre-filled lease information (optional)
        public decimal? RentAmount { get; set; }
        public DateTime? LeaseStart { get; set; }
        public DateTime? LeaseEnd { get; set; }
        public decimal? Deposit { get; set; }
    }

    public enum InvitationStatus
    {
        Pending,
        Accepted,
        Expired,
        Cancelled
    }

    public class CreateInvitationRequest
    {
        public string PropertyId { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public decimal? RentAmount { get; set; }
        public DateTime? LeaseStart { get; set; }
        public DateTime? LeaseEnd { get; set; }
        public decimal? Deposit { get; set; }
    }

    public class TenantOnboardingRequest
    {
        public string InvitationToken { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string Password { get; set; } = string.Empty;

        // Emergency contact
        public string? EmergencyContactName { get; set; }
        public string? EmergencyContactPhone { get; set; }

        // Additional information
        public int? NumberOfOccupants { get; set; }
        public bool? HasPets { get; set; }
        public string? PetDetails { get; set; }
    }
}
