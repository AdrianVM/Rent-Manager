namespace RentManager.API.Models
{
    public class RecentPayment
    {
        public string Id { get; set; } = string.Empty;
        public string TenantName { get; set; } = string.Empty;
        public string PropertyName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public DateTime Date { get; set; }
        public PaymentStatus Status { get; set; }
    }
}