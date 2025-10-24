using Microsoft.EntityFrameworkCore;
using RentManager.API.Data;
using RentManager.API.Models;
using RentManager.API.Services.PaymentGateway;
using System.Text.RegularExpressions;

namespace RentManager.API.Services;

/// <summary>
/// Payment service implementation for handling rent payments in the Romanian market
/// </summary>
public class PaymentService : IPaymentService
{
    private readonly RentManagerDbContext _context;
    private readonly ILogger<PaymentService> _logger;
    private readonly IPaymentGateway? _paymentGateway;

    public PaymentService(
        RentManagerDbContext context,
        ILogger<PaymentService> logger,
        IPaymentGateway? paymentGateway = null)
    {
        _context = context;
        _logger = logger;
        _paymentGateway = paymentGateway;
    }

    #region Payment Retrieval

    public async Task<List<Payment>> GetPaymentsAsync(User? user = null)
    {
        var query = _context.Payments.AsQueryable();

        if (user != null)
        {
            if (user.HasRole(Role.PropertyOwner) && user.PropertyIds.Count > 0)
            {
                var tenantIds = await _context.Tenants
                    .Where(t => user.PropertyIds.Contains(t.PropertyId))
                    .Select(t => t.Id)
                    .ToListAsync();

                query = query.Where(p => tenantIds.Contains(p.TenantId));
            }
            else if (user.HasRole(Role.Renter) && user.TenantId != null)
            {
                query = query.Where(p => p.TenantId == user.TenantId);
            }
        }

        return await query.OrderByDescending(p => p.Date).ToListAsync();
    }

    public async Task<Payment?> GetPaymentAsync(string id, User? user = null)
    {
        var payment = await _context.Payments.FindAsync(id);

        if (payment == null)
            return null;

        if (user != null && !await CanAccessPayment(payment, user))
            return null;

        return payment;
    }

    public async Task<List<Payment>> GetPaymentsByTenantAsync(string tenantId, User? user = null)
    {
        var query = _context.Payments.Where(p => p.TenantId == tenantId);

        if (user != null && !await CanAccessTenant(tenantId, user))
            return new List<Payment>();

        return await query.OrderByDescending(p => p.Date).ToListAsync();
    }

    public async Task<List<Payment>> GetPaymentsByPropertyAsync(string propertyId, User? user = null)
    {
        var tenantIds = await _context.Tenants
            .Where(t => t.PropertyId == propertyId)
            .Select(t => t.Id)
            .ToListAsync();

        if (user != null && !await CanAccessProperty(propertyId, user))
            return new List<Payment>();

        return await _context.Payments
            .Where(p => tenantIds.Contains(p.TenantId))
            .OrderByDescending(p => p.Date)
            .ToListAsync();
    }

    #endregion

    #region Payment Creation and Processing

    public async Task<Payment> CreatePaymentAsync(Payment payment, User? user = null)
    {
        payment.Id = Guid.NewGuid().ToString();
        payment.CreatedAt = DateTime.UtcNow;
        payment.UpdatedAt = DateTime.UtcNow;

        if (string.IsNullOrEmpty(payment.IdempotencyKey))
        {
            payment.IdempotencyKey = Guid.NewGuid().ToString();
        }

        _context.Payments.Add(payment);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Payment created with ID: {PaymentId} for tenant: {TenantId}", payment.Id, payment.TenantId);

        return payment;
    }

    public async Task<Payment> InitiatePaymentAsync(string tenantId, decimal amount, PaymentMethod method, User? user = null)
    {
        var tenant = await _context.Tenants.FindAsync(tenantId);
        if (tenant == null)
        {
            throw new ArgumentException($"Tenant with ID {tenantId} not found");
        }

        if (!await ValidatePaymentAsync(tenantId, amount))
        {
            throw new InvalidOperationException("Payment validation failed");
        }

        var payment = new Payment
        {
            Id = Guid.NewGuid().ToString(),
            TenantId = tenantId,
            Amount = amount,
            Date = DateTime.UtcNow,
            Method = method,
            Status = PaymentStatus.Pending,
            IdempotencyKey = Guid.NewGuid().ToString(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        if (method == PaymentMethod.BankTransfer)
        {
            payment.PaymentReference = await GenerateRomanianPaymentReferenceAsync(tenantId, DateTime.UtcNow);
        }

        _context.Payments.Add(payment);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Payment initiated: {PaymentId} for tenant: {TenantId}, amount: {Amount} RON",
            payment.Id, tenantId, amount);

        return payment;
    }

    public async Task<PaymentGateway.PaymentGatewayResponse> CreatePaymentIntentAsync(string paymentId, User? user = null)
    {
        var payment = await _context.Payments.FindAsync(paymentId);
        if (payment == null)
        {
            throw new ArgumentException($"Payment with ID {paymentId} not found");
        }

        var tenant = await _context.Tenants.FindAsync(payment.TenantId);
        if (tenant == null)
        {
            throw new ArgumentException($"Tenant with ID {payment.TenantId} not found");
        }

        if (_paymentGateway == null)
        {
            throw new InvalidOperationException("Payment gateway not configured");
        }

        var response = await _paymentGateway.CreatePaymentIntentAsync(payment, tenant);

        if (response.Success)
        {
            payment.ExternalTransactionId = response.TransactionId;
            payment.PaymentGatewayProvider = _paymentGateway.ProviderName;
            payment.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        return response;
    }

    public async Task<Payment> ProcessPaymentAsync(string paymentId, string? externalTransactionId = null)
    {
        var payment = await _context.Payments.FindAsync(paymentId);
        if (payment == null)
        {
            throw new ArgumentException($"Payment with ID {paymentId} not found");
        }

        if (payment.Status == PaymentStatus.Completed)
        {
            _logger.LogWarning("Attempt to process already completed payment: {PaymentId}", paymentId);
            return payment;
        }

        var tenant = await _context.Tenants.FindAsync(payment.TenantId);
        if (tenant == null)
        {
            throw new ArgumentException($"Tenant with ID {payment.TenantId} not found");
        }

        payment.Status = PaymentStatus.Processing;
        payment.ExternalTransactionId = externalTransactionId;
        payment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        try
        {
            // Use payment gateway if available (e.g., Stripe)
            if (_paymentGateway != null && (payment.Method == PaymentMethod.CreditCard ||
                payment.Method == PaymentMethod.DebitCard ||
                payment.Method == PaymentMethod.CardOnline ||
                payment.Method == PaymentMethod.Online))
            {
                // If we already have an external transaction ID, the payment was confirmed by Stripe
                // on the frontend, so we just mark it as completed
                if (!string.IsNullOrEmpty(externalTransactionId))
                {
                    payment.Status = PaymentStatus.Completed;
                    payment.ExternalTransactionId = externalTransactionId;
                    payment.ProcessedAt = DateTime.UtcNow;
                    payment.PaymentGatewayProvider = _paymentGateway.ProviderName;
                }
                else
                {
                    // Otherwise, process through the gateway
                    var gatewayResponse = await _paymentGateway.ProcessPaymentAsync(payment, tenant, externalTransactionId);

                    if (gatewayResponse.Success)
                    {
                        payment.Status = gatewayResponse.Status;
                        payment.ExternalTransactionId = gatewayResponse.TransactionId;
                        payment.ProcessedAt = gatewayResponse.ProcessedAt ?? DateTime.UtcNow;
                        payment.ProcessingFee = gatewayResponse.ProcessingFee;
                        payment.PaymentGatewayProvider = _paymentGateway.ProviderName;
                    }
                    else
                    {
                        payment.Status = PaymentStatus.Failed;
                        payment.FailureReason = gatewayResponse.ErrorMessage;
                    }
                }
            }
            else
            {
                // Manual processing for cash, check, or bank transfer
                payment.Status = PaymentStatus.Completed;
                payment.ProcessedAt = DateTime.UtcNow;
            }

            payment.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Payment processed successfully: {PaymentId} via {Method}",
                paymentId, payment.Method);
        }
        catch (Exception ex)
        {
            payment.Status = PaymentStatus.Failed;
            payment.FailureReason = ex.Message;
            payment.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogError(ex, "Payment processing failed: {PaymentId}", paymentId);
            throw;
        }

        return payment;
    }

    public async Task<Payment> ConfirmPaymentAsync(string paymentId, string confirmationCode)
    {
        var payment = await _context.Payments.FindAsync(paymentId);
        if (payment == null)
        {
            throw new ArgumentException($"Payment with ID {paymentId} not found");
        }

        payment.ConfirmationCode = confirmationCode;
        payment.Status = PaymentStatus.Completed;
        payment.ProcessedAt = DateTime.UtcNow;
        payment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Payment confirmed: {PaymentId} with code: {ConfirmationCode}", paymentId, confirmationCode);

        return payment;
    }

    #endregion

    #region Payment Updates

    public async Task<Payment> UpdatePaymentAsync(string id, Payment payment, User? user = null)
    {
        var existingPayment = await _context.Payments.FindAsync(id);
        if (existingPayment == null)
        {
            throw new ArgumentException($"Payment with ID {id} not found");
        }

        if (user != null && !await CanAccessPayment(existingPayment, user))
        {
            throw new UnauthorizedAccessException("User does not have access to this payment");
        }

        existingPayment.Amount = payment.Amount;
        existingPayment.Date = payment.Date;
        existingPayment.Method = payment.Method;
        existingPayment.Status = payment.Status;
        existingPayment.Notes = payment.Notes;
        existingPayment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Payment updated: {PaymentId}", id);

        return existingPayment;
    }

    public async Task<Payment> CancelPaymentAsync(string paymentId, string reason)
    {
        var payment = await _context.Payments.FindAsync(paymentId);
        if (payment == null)
        {
            throw new ArgumentException($"Payment with ID {paymentId} not found");
        }

        if (payment.Status == PaymentStatus.Completed)
        {
            throw new InvalidOperationException("Cannot cancel a completed payment. Use refund instead.");
        }

        payment.Status = PaymentStatus.Cancelled;
        payment.FailureReason = reason;
        payment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Payment cancelled: {PaymentId}, reason: {Reason}", paymentId, reason);

        return payment;
    }

    public async Task<Payment> RefundPaymentAsync(string paymentId, decimal? amount = null, string? reason = null)
    {
        var originalPayment = await _context.Payments.FindAsync(paymentId);
        if (originalPayment == null)
        {
            throw new ArgumentException($"Payment with ID {paymentId} not found");
        }

        if (originalPayment.Status != PaymentStatus.Completed)
        {
            throw new InvalidOperationException("Can only refund completed payments");
        }

        if (originalPayment.IsRefunded)
        {
            throw new InvalidOperationException("Payment has already been refunded");
        }

        var refundAmount = amount ?? originalPayment.Amount;

        if (refundAmount > originalPayment.Amount)
        {
            throw new InvalidOperationException("Refund amount cannot exceed original payment amount");
        }

        // Process refund through payment gateway if applicable
        if (_paymentGateway != null && !string.IsNullOrEmpty(originalPayment.ExternalTransactionId))
        {
            var gatewayResponse = await _paymentGateway.RefundPaymentAsync(originalPayment, refundAmount, reason);
            if (!gatewayResponse.Success)
            {
                throw new InvalidOperationException($"Refund failed: {gatewayResponse.ErrorMessage}");
            }
        }

        var refundPayment = new Payment
        {
            Id = Guid.NewGuid().ToString(),
            TenantId = originalPayment.TenantId,
            Amount = -refundAmount,
            Date = DateTime.UtcNow,
            Method = originalPayment.Method,
            Status = PaymentStatus.Refunded,
            Notes = $"Refund for payment {paymentId}. Reason: {reason}",
            RefundedPaymentId = paymentId,
            RefundReason = reason,
            RefundedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            PaymentGatewayProvider = originalPayment.PaymentGatewayProvider
        };

        originalPayment.IsRefunded = true;
        originalPayment.UpdatedAt = DateTime.UtcNow;

        _context.Payments.Add(refundPayment);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Payment refunded: {PaymentId}, refund amount: {Amount} RON", paymentId, refundAmount);

        return refundPayment;
    }

    #endregion

    #region Payment Validation

    public async Task<bool> ValidatePaymentAsync(string tenantId, decimal amount)
    {
        var tenant = await _context.Tenants.FindAsync(tenantId);
        if (tenant == null)
        {
            _logger.LogWarning("Payment validation failed: Tenant {TenantId} not found", tenantId);
            return false;
        }

        if (amount <= 0)
        {
            _logger.LogWarning("Payment validation failed: Invalid amount {Amount}", amount);
            return false;
        }

        // Additional validation logic can be added here
        // For example, check if amount matches expected rent amount

        return true;
    }

    public async Task<bool> CheckDuplicatePaymentAsync(string tenantId, DateTime date, decimal amount)
    {
        var existingPayment = await _context.Payments
            .Where(p => p.TenantId == tenantId
                && p.Date.Date == date.Date
                && p.Amount == amount
                && p.Status == PaymentStatus.Completed)
            .FirstOrDefaultAsync();

        return existingPayment != null;
    }

    #endregion

    #region Payment Reconciliation

    public async Task<List<Payment>> GetPendingPaymentsAsync(User? user = null)
    {
        var query = _context.Payments.Where(p => p.Status == PaymentStatus.Pending);

        if (user != null)
        {
            if (user.HasRole(Role.PropertyOwner) && user.PropertyIds.Count > 0)
            {
                var tenantIds = await _context.Tenants
                    .Where(t => user.PropertyIds.Contains(t.PropertyId))
                    .Select(t => t.Id)
                    .ToListAsync();

                query = query.Where(p => tenantIds.Contains(p.TenantId));
            }
            else if (user.HasRole(Role.Renter) && user.TenantId != null)
            {
                query = query.Where(p => p.TenantId == user.TenantId);
            }
        }

        return await query.OrderBy(p => p.Date).ToListAsync();
    }

    public async Task<List<Payment>> GetFailedPaymentsAsync(DateTime? from = null, DateTime? to = null)
    {
        var query = _context.Payments.Where(p => p.Status == PaymentStatus.Failed);

        if (from.HasValue)
        {
            query = query.Where(p => p.Date >= from.Value);
        }

        if (to.HasValue)
        {
            query = query.Where(p => p.Date <= to.Value);
        }

        return await query.OrderByDescending(p => p.Date).ToListAsync();
    }

    public async Task<decimal> GetTotalCollectedAsync(DateTime? from = null, DateTime? to = null, User? user = null)
    {
        var query = _context.Payments.Where(p => p.Status == PaymentStatus.Completed);

        if (from.HasValue)
        {
            query = query.Where(p => p.Date >= from.Value);
        }

        if (to.HasValue)
        {
            query = query.Where(p => p.Date <= to.Value);
        }

        if (user != null)
        {
            if (user.HasRole(Role.PropertyOwner) && user.PropertyIds.Count > 0)
            {
                var tenantIds = await _context.Tenants
                    .Where(t => user.PropertyIds.Contains(t.PropertyId))
                    .Select(t => t.Id)
                    .ToListAsync();

                query = query.Where(p => tenantIds.Contains(p.TenantId));
            }
            else if (user.HasRole(Role.Renter) && user.TenantId != null)
            {
                query = query.Where(p => p.TenantId == user.TenantId);
            }
        }

        return await query.SumAsync(p => p.Amount);
    }

    #endregion

    #region Recurring Payments

    public async Task<List<Payment>> GenerateRecurringPaymentsAsync(DateTime forMonth)
    {
        var firstDayOfMonth = new DateTime(forMonth.Year, forMonth.Month, 1);
        var activeTenants = await _context.Tenants
            .Where(t => t.Status == TenantStatus.Active)
            .ToListAsync();

        var generatedPayments = new List<Payment>();

        foreach (var tenant in activeTenants)
        {
            var existingPayment = await _context.Payments
                .Where(p => p.TenantId == tenant.Id
                    && p.RecurringForMonth == firstDayOfMonth
                    && p.IsRecurring)
                .FirstOrDefaultAsync();

            if (existingPayment == null)
            {
                var payment = new Payment
                {
                    Id = Guid.NewGuid().ToString(),
                    TenantId = tenant.Id,
                    Amount = tenant.RentAmount,
                    Date = firstDayOfMonth,
                    Method = PaymentMethod.BankTransfer,
                    Status = PaymentStatus.Pending,
                    IsRecurring = true,
                    RecurringForMonth = firstDayOfMonth,
                    PaymentReference = await GenerateRomanianPaymentReferenceAsync(tenant.Id, forMonth),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Payments.Add(payment);
                generatedPayments.Add(payment);
            }
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Generated {Count} recurring payments for {Month}", generatedPayments.Count, forMonth.ToString("yyyy-MM"));

        return generatedPayments;
    }

    public async Task<Payment?> GetLastPaymentForTenantAsync(string tenantId)
    {
        return await _context.Payments
            .Where(p => p.TenantId == tenantId && p.Status == PaymentStatus.Completed)
            .OrderByDescending(p => p.Date)
            .FirstOrDefaultAsync();
    }

    #endregion

    #region Romanian Specific Methods

    public async Task<string> GenerateRomanianPaymentReferenceAsync(string tenantId, DateTime month)
    {
        var tenant = await _context.Tenants.FindAsync(tenantId);
        if (tenant == null)
        {
            throw new ArgumentException($"Tenant with ID {tenantId} not found");
        }

        // Generate a unique payment reference for Romanian bank transfers
        // Format: RENT-YYYYMM-TENANTSHORTID
        var shortId = tenantId.Substring(0, Math.Min(8, tenantId.Length)).ToUpper();
        var reference = $"RENT-{month:yyyyMM}-{shortId}";

        return reference;
    }

    public Task<bool> ValidateIBANAsync(string iban)
    {
        if (string.IsNullOrWhiteSpace(iban))
            return Task.FromResult(false);

        // Remove spaces and convert to uppercase
        iban = iban.Replace(" ", "").ToUpper();

        // Romanian IBAN format: RO followed by 2 check digits and 20 characters (BBAN)
        // Total length: 24 characters
        var romanianIbanPattern = @"^RO\d{2}[A-Z]{4}[A-Z0-9]{16}$";

        if (!Regex.IsMatch(iban, romanianIbanPattern))
        {
            return Task.FromResult(false);
        }

        // Additional IBAN checksum validation could be implemented here
        // For now, we just validate the format

        return Task.FromResult(true);
    }

    public async Task<Payment?> ReconcilePaymentByReferenceAsync(string reference, decimal amount, DateTime date)
    {
        var payment = await _context.Payments
            .Where(p => p.PaymentReference == reference && p.Status == PaymentStatus.Pending)
            .FirstOrDefaultAsync();

        if (payment == null)
        {
            _logger.LogWarning("Payment reconciliation failed: No pending payment found with reference {Reference}", reference);
            return null;
        }

        if (Math.Abs(payment.Amount - amount) > 0.01m)
        {
            _logger.LogWarning("Payment reconciliation warning: Amount mismatch. Expected {Expected}, received {Received}",
                payment.Amount, amount);
        }

        payment.Status = PaymentStatus.Completed;
        payment.ProcessedAt = date;
        payment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Payment reconciled: {PaymentId} with reference {Reference}", payment.Id, reference);

        return payment;
    }

    #endregion

    #region Analytics and Reporting

    public async Task<Dictionary<PaymentMethod, decimal>> GetPaymentsByMethodAsync(DateTime from, DateTime to, User? user = null)
    {
        var query = _context.Payments
            .Where(p => p.Status == PaymentStatus.Completed
                && p.Date >= from
                && p.Date <= to);

        if (user != null)
        {
            if (user.HasRole(Role.PropertyOwner) && user.PropertyIds.Count > 0)
            {
                var tenantIds = await _context.Tenants
                    .Where(t => user.PropertyIds.Contains(t.PropertyId))
                    .Select(t => t.Id)
                    .ToListAsync();

                query = query.Where(p => tenantIds.Contains(p.TenantId));
            }
            else if (user.HasRole(Role.Renter) && user.TenantId != null)
            {
                query = query.Where(p => p.TenantId == user.TenantId);
            }
        }

        return await query
            .GroupBy(p => p.Method)
            .Select(g => new { Method = g.Key, Total = g.Sum(p => p.Amount) })
            .ToDictionaryAsync(x => x.Method, x => x.Total);
    }

    public async Task<Dictionary<PaymentStatus, int>> GetPaymentStatusDistributionAsync(User? user = null)
    {
        var query = _context.Payments.AsQueryable();

        if (user != null)
        {
            if (user.HasRole(Role.PropertyOwner) && user.PropertyIds.Count > 0)
            {
                var tenantIds = await _context.Tenants
                    .Where(t => user.PropertyIds.Contains(t.PropertyId))
                    .Select(t => t.Id)
                    .ToListAsync();

                query = query.Where(p => tenantIds.Contains(p.TenantId));
            }
            else if (user.HasRole(Role.Renter) && user.TenantId != null)
            {
                query = query.Where(p => p.TenantId == user.TenantId);
            }
        }

        return await query
            .GroupBy(p => p.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Status, x => x.Count);
    }

    #endregion

    #region Delete

    public async Task<bool> DeletePaymentAsync(string id, User? user = null)
    {
        var payment = await _context.Payments.FindAsync(id);
        if (payment == null)
        {
            return false;
        }

        if (user != null && !user.HasRole(Role.Admin))
        {
            _logger.LogWarning("Non-admin user attempted to delete payment: {PaymentId}", id);
            return false;
        }

        _context.Payments.Remove(payment);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Payment deleted: {PaymentId}", id);

        return true;
    }

    #endregion

    #region Private Helper Methods

    private async Task<bool> CanAccessPayment(Payment payment, User user)
    {
        if (user.HasRole(Role.Admin))
            return true;

        if (user.HasRole(Role.Renter) && user.TenantId == payment.TenantId)
            return true;

        if (user.HasRole(Role.PropertyOwner))
        {
            var tenant = await _context.Tenants.FindAsync(payment.TenantId);
            if (tenant != null && user.PropertyIds.Contains(tenant.PropertyId))
                return true;
        }

        return false;
    }

    private async Task<bool> CanAccessTenant(string tenantId, User user)
    {
        if (user.HasRole(Role.Admin))
            return true;

        if (user.HasRole(Role.Renter) && user.TenantId == tenantId)
            return true;

        if (user.HasRole(Role.PropertyOwner))
        {
            var tenant = await _context.Tenants.FindAsync(tenantId);
            if (tenant != null && user.PropertyIds.Contains(tenant.PropertyId))
                return true;
        }

        return false;
    }

    private async Task<bool> CanAccessProperty(string propertyId, User user)
    {
        if (user.HasRole(Role.Admin))
            return true;

        if (user.HasRole(Role.PropertyOwner) && user.PropertyIds.Contains(propertyId))
            return true;

        if (user.HasRole(Role.Renter) && user.TenantId != null)
        {
            var tenant = await _context.Tenants.FindAsync(user.TenantId);
            if (tenant != null && tenant.PropertyId == propertyId)
                return true;
        }

        return false;
    }

    #endregion
}
