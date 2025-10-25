namespace RentManager.API.Models
{
    public class TenantInvitation
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string PropertyId { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string InvitationToken { get; set; } = Guid.NewGuid().ToString();
        public DateTimeOffset ExpiresAt { get; set; } = DateTimeOffset.UtcNow.AddDays(7);
        public InvitationStatus Status { get; set; } = InvitationStatus.Pending;
        public string? InvitedByUserId { get; set; }
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

        // Pre-filled lease information (optional)
        public decimal? RentAmount { get; set; }
        public DateTimeOffset? LeaseStart { get; set; }
        public DateTimeOffset? LeaseEnd { get; set; }
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
        public DateTimeOffset? LeaseStart { get; set; }
        public DateTimeOffset? LeaseEnd { get; set; }
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
