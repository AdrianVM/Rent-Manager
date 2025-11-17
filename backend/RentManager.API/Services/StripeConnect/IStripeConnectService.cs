using RentManager.API.Models;

namespace RentManager.API.Services.StripeConnect;

/// <summary>
/// Service for managing Stripe Connect accounts for property owners
/// Handles onboarding, verification, and account management
/// </summary>
public interface IStripeConnectService
{
    /// <summary>
    /// Create a new Stripe Connect account for a property owner
    /// </summary>
    /// <param name="propertyOwnerId">Property owner ID</param>
    /// <param name="accountType">Type of Connect account (Express recommended)</param>
    /// <param name="email">Email for Stripe communications</param>
    /// <returns>Created Stripe Connect account with onboarding URL</returns>
    Task<StripeConnectAccount> CreateConnectAccountAsync(
        string propertyOwnerId,
        StripeAccountType accountType = StripeAccountType.Express,
        string? email = null);

    /// <summary>
    /// Generate an onboarding link for a property owner to complete Stripe verification
    /// </summary>
    /// <param name="stripeConnectAccountId">Stripe Connect account ID</param>
    /// <param name="refreshUrl">URL to redirect if user leaves onboarding</param>
    /// <param name="returnUrl">URL to redirect after successful onboarding</param>
    /// <returns>Onboarding URL and expiration time</returns>
    Task<OnboardingLinkResult> GenerateOnboardingLinkAsync(
        string stripeConnectAccountId,
        string refreshUrl,
        string returnUrl);

    /// <summary>
    /// Refresh account status from Stripe (capabilities, verification, etc.)
    /// Call this after onboarding or periodically to sync status
    /// </summary>
    /// <param name="stripeConnectAccountId">Stripe Connect account ID</param>
    /// <returns>Updated account</returns>
    Task<StripeConnectAccount> RefreshAccountStatusAsync(string stripeConnectAccountId);

    /// <summary>
    /// Get Stripe Connect account by property owner ID
    /// </summary>
    /// <param name="propertyOwnerId">Property owner ID</param>
    /// <returns>Stripe Connect account or null if not found</returns>
    Task<StripeConnectAccount?> GetAccountByPropertyOwnerIdAsync(string propertyOwnerId);

    /// <summary>
    /// Get Stripe Connect account by Stripe account ID
    /// </summary>
    /// <param name="stripeAccountId">Stripe account ID (acc_xxxxx)</param>
    /// <returns>Stripe Connect account or null if not found</returns>
    Task<StripeConnectAccount?> GetAccountByStripeAccountIdAsync(string stripeAccountId);

    /// <summary>
    /// Check if a property owner can receive payments
    /// </summary>
    /// <param name="propertyOwnerId">Property owner ID</param>
    /// <returns>True if account is active and can accept payments</returns>
    Task<bool> CanAcceptPaymentsAsync(string propertyOwnerId);

    /// <summary>
    /// Disable a Stripe Connect account
    /// </summary>
    /// <param name="stripeConnectAccountId">Stripe Connect account ID</param>
    /// <param name="reason">Reason for deactivation</param>
    /// <returns>Updated account</returns>
    Task<StripeConnectAccount> DisableAccountAsync(string stripeConnectAccountId, string reason);

    /// <summary>
    /// Enable a previously disabled Stripe Connect account
    /// </summary>
    /// <param name="stripeConnectAccountId">Stripe Connect account ID</param>
    /// <returns>Updated account</returns>
    Task<StripeConnectAccount> EnableAccountAsync(string stripeConnectAccountId);

    /// <summary>
    /// Generate a login link for the connected account dashboard
    /// Allows property owners to manage their Stripe account
    /// </summary>
    /// <param name="stripeConnectAccountId">Stripe Connect account ID</param>
    /// <returns>Login link URL</returns>
    Task<string> GenerateLoginLinkAsync(string stripeConnectAccountId);

    /// <summary>
    /// Get account balance for a connected account
    /// </summary>
    /// <param name="stripeAccountId">Stripe account ID</param>
    /// <returns>Balance information</returns>
    Task<AccountBalanceResult> GetAccountBalanceAsync(string stripeAccountId);

    /// <summary>
    /// Create a payout to the connected account's bank account
    /// </summary>
    /// <param name="stripeAccountId">Stripe account ID</param>
    /// <param name="amount">Amount to payout</param>
    /// <param name="currency">Currency code</param>
    /// <param name="description">Payout description</param>
    /// <returns>Payout result</returns>
    Task<PayoutResult> CreatePayoutAsync(
        string stripeAccountId,
        decimal amount,
        string currency = "ron",
        string? description = null);

    /// <summary>
    /// List all payouts for a connected account
    /// </summary>
    /// <param name="stripeAccountId">Stripe account ID</param>
    /// <param name="limit">Number of results to return</param>
    /// <returns>List of payouts</returns>
    Task<List<PayoutResult>> ListPayoutsAsync(string stripeAccountId, int limit = 10);
}

/// <summary>
/// Result of generating an onboarding link
/// </summary>
public class OnboardingLinkResult
{
    public string Url { get; set; } = string.Empty;
    public DateTimeOffset ExpiresAt { get; set; }
    public string StripeConnectAccountId { get; set; } = string.Empty;
}

/// <summary>
/// Result of checking account balance
/// </summary>
public class AccountBalanceResult
{
    public decimal Available { get; set; }
    public decimal Pending { get; set; }
    public string Currency { get; set; } = string.Empty;
    public DateTimeOffset? NextPayoutDate { get; set; }
    public decimal? NextPayoutAmount { get; set; }
}

/// <summary>
/// Result of creating a payout
/// </summary>
public class PayoutResult
{
    public string PayoutId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty; // paid, pending, in_transit, canceled, failed
    public DateTimeOffset? ArrivalDate { get; set; }
    public string? BankAccountLast4 { get; set; }
    public string? Description { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
