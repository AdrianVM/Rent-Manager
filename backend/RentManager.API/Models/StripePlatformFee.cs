namespace RentManager.API.Models
{
    /// <summary>
    /// Configurable platform fee structure for different payment scenarios
    /// Allows flexible pricing models (percentage, fixed, or hybrid)
    /// </summary>
    public class StripePlatformFee
    {
        public string Id { get; set; } = string.Empty;

        // Fee structure name and description
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsDefault { get; set; }

        // Fee calculation parameters
        public PlatformFeeType FeeType { get; set; } = PlatformFeeType.Percentage;
        public decimal PercentageFee { get; set; } // e.g., 3.5 for 3.5%
        public decimal FixedFee { get; set; } // e.g., 5.00 RON
        public decimal MinimumFee { get; set; } // Minimum fee to charge
        public decimal MaximumFee { get; set; } // Maximum fee cap

        // Applicability rules
        public string? ApplicableToOwnerType { get; set; } // "Person", "Company", or null for all
        public decimal? MinPaymentAmount { get; set; } // Only apply to payments above this amount
        public decimal? MaxPaymentAmount { get; set; } // Only apply to payments below this amount

        // Property-specific fees (optional)
        public string? PropertyId { get; set; } // If set, applies only to this property
        public Property? Property { get; set; }

        // Temporal validity
        public DateTimeOffset? ValidFrom { get; set; }
        public DateTimeOffset? ValidTo { get; set; }

        // Promotional/discount features
        public bool IsPromotional { get; set; }
        public int? FreePaymentsCount { get; set; } // First N payments are free

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    }

    public enum PlatformFeeType
    {
        Percentage,      // e.g., 3.5% of payment
        Fixed,           // e.g., 5.00 RON per payment
        Hybrid           // Both percentage + fixed
    }

    /// <summary>
    /// Helper class for fee calculation results
    /// </summary>
    public class FeeCalculationResult
    {
        public decimal GrossAmount { get; set; }
        public decimal PlatformFee { get; set; }
        public decimal StripeFee { get; set; }
        public decimal NetAmount { get; set; }
        public string FeeStructureId { get; set; } = string.Empty;
        public string FeeStructureName { get; set; } = string.Empty;
        public string Calculation { get; set; } = string.Empty; // Human-readable explanation
    }
}
