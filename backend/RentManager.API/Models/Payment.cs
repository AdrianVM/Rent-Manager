namespace RentManager.API.Models
{
    public class Payment
    {
        public string Id { get; set; } = string.Empty;
        public string TenantId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public DateTime Date { get; set; }
        public PaymentMethod Method { get; set; }
        public PaymentStatus Status { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public enum PaymentMethod
    {
        Cash,
        Check,
        BankTransfer,
        CreditCard,
        Online
    }

    public enum PaymentStatus
    {
        Completed,
        Pending,
        Failed
    }
}