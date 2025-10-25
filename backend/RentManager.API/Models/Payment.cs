namespace RentManager.API.Models
{
    public class Payment
    {
        public string Id { get; set; } = string.Empty;
        public string TenantId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public DateTimeOffset Date { get; set; }
        public PaymentMethod Method { get; set; }
        public PaymentStatus Status { get; set; }
        public string? Notes { get; set; }

        // Transaction tracking
        public string? ExternalTransactionId { get; set; }
        public string? PaymentGatewayProvider { get; set; }
        public DateTimeOffset? ProcessedAt { get; set; }
        public decimal? ProcessingFee { get; set; }
        public string? FailureReason { get; set; }
        public string? IdempotencyKey { get; set; }

        // Romanian specific fields
        public string? PaymentReference { get; set; }
        public string? BankIBAN { get; set; }
        public string? BankAccountHolder { get; set; }
        public string? ConfirmationCode { get; set; }

        // Recurring payment tracking
        public bool IsRecurring { get; set; }
        public DateTimeOffset? RecurringForMonth { get; set; }

        // Refund tracking
        public bool IsRefunded { get; set; }
        public string? RefundedPaymentId { get; set; }
        public DateTimeOffset? RefundedAt { get; set; }
        public string? RefundReason { get; set; }

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    }

    public enum PaymentMethod
    {
        Cash,
        Check,
        BankTransfer,
        CreditCard,
        Online,
        DebitCard,
        MobilePay,
        CardOnline
    }

    public enum PaymentStatus
    {
        Completed,
        Pending,
        Failed,
        Cancelled,
        Processing,
        Refunded
    }
}