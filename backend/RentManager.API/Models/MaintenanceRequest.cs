namespace RentManager.API.Models
{
    public class MaintenanceRequest
    {
        public string Id { get; set; } = string.Empty;
        public string TenantId { get; set; } = string.Empty;
        public Tenant? Tenant { get; set; }
        public string PropertyId { get; set; } = string.Empty;
        public Property? Property { get; set; }

        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public MaintenanceStatus Status { get; set; } = MaintenanceStatus.Pending;
        public MaintenancePriority Priority { get; set; } = MaintenancePriority.Medium;

        public DateTimeOffset? ResolvedAt { get; set; }
        public string? AssignedTo { get; set; }
        public string? ResolutionNotes { get; set; }

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    }

    public enum MaintenanceStatus
    {
        Pending,
        InProgress,
        Completed,
        Cancelled
    }

    public enum MaintenancePriority
    {
        Low,
        Medium,
        High,
        Emergency
    }
}
