namespace RentManager.API.Models
{
    /// <summary>
    /// Represents a transfer from the platform to a property owner's Stripe Connect account
    /// Tracks the movement of funds after a tenant payment
    /// </summary>
    public class StripeTransfer
    {
        public string Id { get; set; } = string.Empty;

        // Link to the original payment
        public string PaymentId { get; set; } = string.Empty;
        public Payment Payment { get; set; } = null!;

        // Link to the connected account
        public string StripeConnectAccountId { get; set; } = string.Empty;
        public StripeConnectAccount StripeConnectAccount { get; set; } = null!;

        // Stripe transfer details
        public string StripeTransferId { get; set; } = string.Empty;
        public string StripePaymentIntentId { get; set; } = string.Empty;

        // Amounts (in platform currency - RON)
        public decimal GrossAmount { get; set; } // Total payment amount
        public decimal PlatformFee { get; set; } // Fee retained by platform
        public decimal StripeFee { get; set; } // Fee charged by Stripe
        public decimal NetAmount { get; set; } // Amount transferred to property owner

        // Transfer status
        public StripeTransferStatus Status { get; set; } = StripeTransferStatus.Pending;
        public string? FailureReason { get; set; }
        public string? FailureCode { get; set; }

        // Timing
        public DateTimeOffset? TransferredAt { get; set; }
        public DateTimeOffset? ExpectedArrivalDate { get; set; }
        public DateTimeOffset? ActualArrivalDate { get; set; }

        // Payout tracking
        public string? StripePayoutId { get; set; }
        public bool PayoutCompleted { get; set; }
        public DateTimeOffset? PayoutCompletedAt { get; set; }

        // Reversal tracking (for refunds)
        public bool IsReversed { get; set; }
        public string? ReversalId { get; set; }
        public DateTimeOffset? ReversedAt { get; set; }
        public string? ReversalReason { get; set; }

        // Metadata
        public string? Description { get; set; }
        public string? Metadata { get; set; } // JSON for additional data
        public string? IdempotencyKey { get; set; }

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    }

    public enum StripeTransferStatus
    {
        Pending,        // Transfer scheduled but not yet initiated
        InTransit,      // Transfer initiated, funds in transit
        Completed,      // Transfer successful, funds delivered
        Failed,         // Transfer failed
        Cancelled,      // Transfer cancelled before completion
        Reversed        // Transfer reversed (refund scenario)
    }
}
