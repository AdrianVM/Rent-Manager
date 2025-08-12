namespace RentManager.API.Models
{
    public class Tenant
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string PropertyId { get; set; } = string.Empty;
        public DateTime? LeaseStart { get; set; }
        public DateTime? LeaseEnd { get; set; }
        public decimal RentAmount { get; set; }
        public decimal? Deposit { get; set; }
        public TenantStatus Status { get; set; } = TenantStatus.Active;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public enum TenantStatus
    {
        Active,
        Inactive,
        Pending
    }
}