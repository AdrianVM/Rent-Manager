using RentManager.API.Models;

namespace RentManager.API.Services;

/// <summary>
/// Payment service interface for handling rent payments in the Romanian market
/// </summary>
public interface IPaymentService
{
    // Payment retrieval
    Task<List<Payment>> GetPaymentsAsync(User? user = null);
    Task<Payment?> GetPaymentAsync(string id, User? user = null);
    Task<List<Payment>> GetPaymentsByTenantAsync(string tenantId, User? user = null);
    Task<List<Payment>> GetPaymentsByPropertyAsync(string propertyId, User? user = null);

    // Payment creation and processing
    Task<Payment> CreatePaymentAsync(Payment payment, User? user = null);
    Task<Payment> InitiatePaymentAsync(string tenantId, decimal amount, PaymentMethod method, User? user = null);
    Task<PaymentGateway.PaymentGatewayResponse> CreatePaymentIntentAsync(string paymentId, User? user = null);
    Task<Payment> ProcessPaymentAsync(string paymentId, string? externalTransactionId = null);
    Task<Payment> ConfirmPaymentAsync(string paymentId, string confirmationCode);

    // Payment updates
    Task<Payment> UpdatePaymentAsync(string id, Payment payment, User? user = null);
    Task<Payment> CancelPaymentAsync(string paymentId, string reason);
    Task<Payment> RefundPaymentAsync(string paymentId, decimal? amount = null, string? reason = null);

    // Payment validation
    Task<bool> ValidatePaymentAsync(string tenantId, decimal amount);
    Task<bool> CheckDuplicatePaymentAsync(string tenantId, DateTimeOffset date, decimal amount);

    // Payment reconciliation
    Task<List<Payment>> GetPendingPaymentsAsync(User? user = null);
    Task<List<Payment>> GetFailedPaymentsAsync(DateTimeOffset? from = null, DateTimeOffset? to = null);
    Task<decimal> GetTotalCollectedAsync(DateTimeOffset? from = null, DateTimeOffset? to = null, User? user = null);

    // Recurring payments (for rent automation)
    Task<List<Payment>> GenerateRecurringPaymentsAsync(DateTimeOffset forMonth);
    Task<Payment?> GetLastPaymentForTenantAsync(string tenantId);

    // Romanian specific methods
    Task<string> GenerateRomanianPaymentReferenceAsync(string tenantId, DateTimeOffset month);
    Task<bool> ValidateIBANAsync(string iban);
    Task<Payment?> ReconcilePaymentByReferenceAsync(string reference, decimal amount, DateTimeOffset date);

    // Analytics and reporting
    Task<Dictionary<PaymentMethod, decimal>> GetPaymentsByMethodAsync(DateTimeOffset from, DateTimeOffset to, User? user = null);
    Task<Dictionary<PaymentStatus, int>> GetPaymentStatusDistributionAsync(User? user = null);

    // Delete (admin only)
    Task<bool> DeletePaymentAsync(string id, User? user = null);
}
