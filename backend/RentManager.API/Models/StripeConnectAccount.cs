namespace RentManager.API.Models
{
    /// <summary>
    /// Represents a Stripe Connect account for a property owner
    /// Enables property owners (both individuals and companies) to receive payments
    /// </summary>
    public class StripeConnectAccount
    {
        public string Id { get; set; } = string.Empty;

        // Link to property owner
        public string PropertyOwnerId { get; set; } = string.Empty;
        public PropertyOwner PropertyOwner { get; set; } = null!;

        // Stripe account details
        public string StripeAccountId { get; set; } = string.Empty;
        public StripeAccountType AccountType { get; set; } = StripeAccountType.Express;
        public StripeAccountStatus Status { get; set; } = StripeAccountStatus.PendingOnboarding;

        // Onboarding tracking
        public bool OnboardingCompleted { get; set; }
        public DateTimeOffset? OnboardingCompletedAt { get; set; }
        public string? OnboardingUrl { get; set; }
        public DateTimeOffset? OnboardingUrlExpiresAt { get; set; }

        // Capabilities (what the account can do)
        public bool CanAcceptPayments { get; set; }
        public bool CanCreatePayouts { get; set; }
        public string? DisabledReason { get; set; }

        // Verification status
        public bool IdentityVerified { get; set; }
        public bool DocumentsRequired { get; set; }
        public string? RequiredDocuments { get; set; } // JSON array of required document types
        public DateTimeOffset? VerifiedAt { get; set; }

        // Payout configuration
        public string? Currency { get; set; } = "ron";
        public string? DefaultPayoutSchedule { get; set; } = "manual"; // manual, daily, weekly, monthly
        public bool InstantPayoutsEnabled { get; set; }

        // Bank account info (last 4 digits for display only)
        public string? BankAccountLast4 { get; set; }
        public string? BankName { get; set; }
        public string? BankCountry { get; set; }

        // Email for Stripe communications
        public string? StripeEmail { get; set; }

        // Metadata
        public string? Metadata { get; set; } // JSON for additional data
        public bool IsActive { get; set; } = true;
        public string? DeactivationReason { get; set; }
        public DateTimeOffset? DeactivatedAt { get; set; }

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    }

    public enum StripeAccountType
    {
        Express,    // Recommended for most users - simplified onboarding
        Standard,   // Full control, more complex setup
        Custom      // Platform has full control (not recommended for individuals)
    }

    public enum StripeAccountStatus
    {
        PendingOnboarding,  // Created but onboarding not started
        OnboardingStarted,  // User clicked onboarding link
        OnboardingIncomplete, // Onboarding started but not finished
        Active,             // Fully verified and can accept payments
        Restricted,         // Account has restrictions (needs more info)
        Disabled,           // Account disabled by Stripe or platform
        Rejected            // Application rejected by Stripe
    }
}
