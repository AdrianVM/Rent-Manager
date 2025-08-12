namespace RentManager.API.Models
{
    public class OutstandingRentItem
    {
        public string TenantId { get; set; } = string.Empty;
        public string TenantName { get; set; } = string.Empty;
        public string PropertyName { get; set; } = string.Empty;
        public decimal AmountDue { get; set; }
        public decimal TotalPaid { get; set; }
        public bool IsOverdue { get; set; }
    }
}