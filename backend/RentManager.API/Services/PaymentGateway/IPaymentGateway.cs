using RentManager.API.Models;

namespace RentManager.API.Services.PaymentGateway;

/// <summary>
/// Payment gateway abstraction for processing payments through external providers
/// </summary>
public interface IPaymentGateway
{
    /// <summary>
    /// Get the name of the payment gateway provider
    /// </summary>
    string ProviderName { get; }

    /// <summary>
    /// Create a payment intent or session
    /// </summary>
    /// <param name="payment">Payment to process</param>
    /// <param name="tenant">Tenant making the payment</param>
    /// <returns>Payment gateway response with payment details</returns>
    Task<PaymentGatewayResponse> CreatePaymentIntentAsync(Payment payment, Tenant tenant);

    /// <summary>
    /// Process a payment (charge the customer)
    /// </summary>
    /// <param name="payment">Payment to process</param>
    /// <param name="tenant">Tenant making the payment</param>
    /// <param name="paymentMethodId">Payment method ID from the gateway</param>
    /// <returns>Payment gateway response</returns>
    Task<PaymentGatewayResponse> ProcessPaymentAsync(Payment payment, Tenant tenant, string? paymentMethodId = null);

    /// <summary>
    /// Confirm a payment that requires additional action
    /// </summary>
    /// <param name="payment">Payment to confirm</param>
    /// <param name="confirmationData">Confirmation data from the gateway</param>
    /// <returns>Payment gateway response</returns>
    Task<PaymentGatewayResponse> ConfirmPaymentAsync(Payment payment, string confirmationData);

    /// <summary>
    /// Refund a payment (full or partial)
    /// </summary>
    /// <param name="payment">Original payment to refund</param>
    /// <param name="amount">Amount to refund (null for full refund)</param>
    /// <param name="reason">Reason for refund</param>
    /// <returns>Payment gateway response</returns>
    Task<PaymentGatewayResponse> RefundPaymentAsync(Payment payment, decimal? amount = null, string? reason = null);

    /// <summary>
    /// Cancel a payment that hasn't been captured yet
    /// </summary>
    /// <param name="payment">Payment to cancel</param>
    /// <param name="reason">Reason for cancellation</param>
    /// <returns>Payment gateway response</returns>
    Task<PaymentGatewayResponse> CancelPaymentAsync(Payment payment, string reason);

    /// <summary>
    /// Verify webhook signature to ensure the request is from the payment gateway
    /// </summary>
    /// <param name="payload">Webhook payload</param>
    /// <param name="signature">Webhook signature</param>
    /// <returns>True if signature is valid</returns>
    Task<bool> VerifyWebhookSignatureAsync(string payload, string signature);

    /// <summary>
    /// Create a customer in the payment gateway
    /// </summary>
    /// <param name="tenant">Tenant to create as customer</param>
    /// <returns>Customer ID from the gateway</returns>
    Task<string> CreateCustomerAsync(Tenant tenant);

    /// <summary>
    /// Get payment status from the gateway
    /// </summary>
    /// <param name="externalTransactionId">Transaction ID from the gateway</param>
    /// <returns>Payment status</returns>
    Task<PaymentGatewayResponse> GetPaymentStatusAsync(string externalTransactionId);
}

/// <summary>
/// Response from a payment gateway operation
/// </summary>
public class PaymentGatewayResponse
{
    public bool Success { get; set; }
    public string? TransactionId { get; set; }
    public string? CustomerId { get; set; }
    public PaymentStatus Status { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
    public decimal? ProcessingFee { get; set; }
    public DateTimeOffset? ProcessedAt { get; set; }
    public string? ConfirmationCode { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }

    /// <summary>
    /// Client secret for frontend confirmation (e.g., Stripe Payment Intent)
    /// </summary>
    public string? ClientSecret { get; set; }

    /// <summary>
    /// Checkout URL for hosted payment pages
    /// </summary>
    public string? CheckoutUrl { get; set; }
}
