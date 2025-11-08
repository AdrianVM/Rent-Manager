namespace RentManager.API.Models
{
    /// <summary>
    /// DTO for updating tenant information
    /// </summary>
    public class TenantUpdateRequest
    {
        public TenantType TenantType { get; set; } = TenantType.Person;
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? PersonId { get; set; }
        public string? CompanyId { get; set; }
        public string PropertyId { get; set; } = string.Empty;
        public DateTimeOffset? LeaseStart { get; set; }
        public DateTimeOffset? LeaseEnd { get; set; }
        public decimal RentAmount { get; set; }
        public decimal? Deposit { get; set; }
        public TenantStatus Status { get; set; } = TenantStatus.Active;
        public string? EmergencyContactName { get; set; }
        public string? EmergencyContactPhone { get; set; }
        public string? EmergencyContactRelation { get; set; }
    }
}
