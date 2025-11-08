using Microsoft.EntityFrameworkCore;
using RentManager.API.Data;
using RentManager.API.Models;
using RentManager.API.Services.PaymentGateway;
using RentManager.API.Services.Email;
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
    private readonly IEmailService _emailService;
    private readonly IEmailTemplateService _emailTemplateService;
    private readonly IConfiguration _configuration;

    public PaymentService(
        RentManagerDbContext context,
        ILogger<PaymentService> logger,
        IEmailService emailService,
        IEmailTemplateService emailTemplateService,
        IConfiguration configuration,
        IPaymentGateway? paymentGateway = null)
    {
        _context = context;
        _logger = logger;
        _emailService = emailService;
        _emailTemplateService = emailTemplateService;
        _configuration = configuration;
        _paymentGateway = paymentGateway;
    }

    #region Payment Retrieval

    public async Task<List<Payment>> GetPaymentsAsync(User? user = null)
    {
        var query = _context.Payments.AsQueryable();

        if (user != null)
        {
            if (user.HasRole(Role.PropertyOwner) && user.PersonId != null)
            {
                // Get property IDs owned by this user through PropertyOwner entity
                var propertyIds = await _context.PropertyOwners
                    .Where(po => po.PersonOwners.Any(p => p.Id == user.PersonId))
                    .Select(po => po.PropertyId)
                    .ToListAsync();

                var tenantIds = await _context.Tenants
                    .Where(t => propertyIds.Contains(t.PropertyId))
                    .Select(t => t.Id)
                    .ToListAsync();

                query = query.Where(p => tenantIds.Contains(p.TenantId));
            }
            else if (user.HasRole(Role.Renter) && user.PersonId != null)
            {
                var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.PersonId == user.PersonId);
                if (tenant != null)
                {
                    query = query.Where(p => p.TenantId == tenant.Id);
                }
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
        payment.CreatedAt = DateTimeOffset.UtcNow;
        payment.UpdatedAt = DateTimeOffset.UtcNow;

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
            Date = DateTimeOffset.UtcNow,
            Method = method,
            Status = PaymentStatus.Pending,
            IdempotencyKey = Guid.NewGuid().ToString(),
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        if (method == PaymentMethod.BankTransfer)
        {
            payment.PaymentReference = await GenerateRomanianPaymentReferenceAsync(tenantId, DateTimeOffset.UtcNow);
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
            payment.UpdatedAt = DateTimeOffset.UtcNow;
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
        payment.UpdatedAt = DateTimeOffset.UtcNow;

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
                    payment.ProcessedAt = DateTimeOffset.UtcNow;
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
                        payment.ProcessedAt = gatewayResponse.ProcessedAt ?? DateTimeOffset.UtcNow;
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
                payment.ProcessedAt = DateTimeOffset.UtcNow;
            }

            payment.UpdatedAt = DateTimeOffset.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Payment processed successfully: {PaymentId} via {Method}",
                paymentId, payment.Method);

            // Send payment confirmation email if payment was completed
            if (payment.Status == PaymentStatus.Completed)
            {
                await SendPaymentConfirmationEmailAsync(payment);
            }
        }
        catch (Exception ex)
        {
            payment.Status = PaymentStatus.Failed;
            payment.FailureReason = ex.Message;
            payment.UpdatedAt = DateTimeOffset.UtcNow;

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
        payment.ProcessedAt = DateTimeOffset.UtcNow;
        payment.UpdatedAt = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Payment confirmed: {PaymentId} with code: {ConfirmationCode}", paymentId, confirmationCode);

        // Send payment confirmation email
        await SendPaymentConfirmationEmailAsync(payment);

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
        existingPayment.UpdatedAt = DateTimeOffset.UtcNow;

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
        payment.UpdatedAt = DateTimeOffset.UtcNow;

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
            Date = DateTimeOffset.UtcNow,
            Method = originalPayment.Method,
            Status = PaymentStatus.Refunded,
            Notes = $"Refund for payment {paymentId}. Reason: {reason}",
            RefundedPaymentId = paymentId,
            RefundReason = reason,
            RefundedAt = DateTimeOffset.UtcNow,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
            PaymentGatewayProvider = originalPayment.PaymentGatewayProvider
        };

        originalPayment.IsRefunded = true;
        originalPayment.UpdatedAt = DateTimeOffset.UtcNow;

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

    public async Task<bool> CheckDuplicatePaymentAsync(string tenantId, DateTimeOffset date, decimal amount)
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
            if (user.HasRole(Role.PropertyOwner) && user.PersonId != null)
            {
                // Get property IDs owned by this user through PropertyOwner entity
                var propertyIds = await _context.PropertyOwners
                    .Where(po => po.PersonOwners.Any(p => p.Id == user.PersonId))
                    .Select(po => po.PropertyId)
                    .ToListAsync();

                var tenantIds = await _context.Tenants
                    .Where(t => propertyIds.Contains(t.PropertyId))
                    .Select(t => t.Id)
                    .ToListAsync();

                query = query.Where(p => tenantIds.Contains(p.TenantId));
            }
            else if (user.HasRole(Role.Renter) && user.PersonId != null)
            {
                var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.PersonId == user.PersonId);
                if (tenant != null)
                {
                    query = query.Where(p => p.TenantId == tenant.Id);
                }
            }
        }

        return await query.OrderBy(p => p.Date).ToListAsync();
    }

    public async Task<List<Payment>> GetFailedPaymentsAsync(DateTimeOffset? from = null, DateTimeOffset? to = null)
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

    public async Task<decimal> GetTotalCollectedAsync(DateTimeOffset? from = null, DateTimeOffset? to = null, User? user = null)
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
            if (user.HasRole(Role.PropertyOwner) && user.PersonId != null)
            {
                // Get property IDs owned by this user through PropertyOwner entity
                var propertyIds = await _context.PropertyOwners
                    .Where(po => po.PersonOwners.Any(p => p.Id == user.PersonId))
                    .Select(po => po.PropertyId)
                    .ToListAsync();

                var tenantIds = await _context.Tenants
                    .Where(t => propertyIds.Contains(t.PropertyId))
                    .Select(t => t.Id)
                    .ToListAsync();

                query = query.Where(p => tenantIds.Contains(p.TenantId));
            }
            else if (user.HasRole(Role.Renter) && user.PersonId != null)
            {
                var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.PersonId == user.PersonId);
                if (tenant != null)
                {
                    query = query.Where(p => p.TenantId == tenant.Id);
                }
            }
        }

        return await query.SumAsync(p => p.Amount);
    }

    #endregion

    #region Recurring Payments

    public async Task<List<Payment>> GenerateRecurringPaymentsAsync(DateTimeOffset forMonth)
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
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
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

    public async Task<string> GenerateRomanianPaymentReferenceAsync(string tenantId, DateTimeOffset month)
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

    public async Task<Payment?> ReconcilePaymentByReferenceAsync(string reference, decimal amount, DateTimeOffset date)
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
        payment.UpdatedAt = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Payment reconciled: {PaymentId} with reference {Reference}", payment.Id, reference);

        return payment;
    }

    #endregion

    #region Analytics and Reporting

    public async Task<Dictionary<PaymentMethod, decimal>> GetPaymentsByMethodAsync(DateTimeOffset from, DateTimeOffset to, User? user = null)
    {
        var query = _context.Payments
            .Where(p => p.Status == PaymentStatus.Completed
                && p.Date >= from
                && p.Date <= to);

        if (user != null)
        {
            if (user.HasRole(Role.PropertyOwner) && user.PersonId != null)
            {
                // Get property IDs owned by this user through PropertyOwner entity
                var propertyIds = await _context.PropertyOwners
                    .Where(po => po.PersonOwners.Any(p => p.Id == user.PersonId))
                    .Select(po => po.PropertyId)
                    .ToListAsync();

                var tenantIds = await _context.Tenants
                    .Where(t => propertyIds.Contains(t.PropertyId))
                    .Select(t => t.Id)
                    .ToListAsync();

                query = query.Where(p => tenantIds.Contains(p.TenantId));
            }
            else if (user.HasRole(Role.Renter) && user.PersonId != null)
            {
                var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.PersonId == user.PersonId);
                if (tenant != null)
                {
                    query = query.Where(p => p.TenantId == tenant.Id);
                }
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
            if (user.HasRole(Role.PropertyOwner) && user.PersonId != null)
            {
                // Get property IDs owned by this user through PropertyOwner entity
                var propertyIds = await _context.PropertyOwners
                    .Where(po => po.PersonOwners.Any(p => p.Id == user.PersonId))
                    .Select(po => po.PropertyId)
                    .ToListAsync();

                var tenantIds = await _context.Tenants
                    .Where(t => propertyIds.Contains(t.PropertyId))
                    .Select(t => t.Id)
                    .ToListAsync();

                query = query.Where(p => tenantIds.Contains(p.TenantId));
            }
            else if (user.HasRole(Role.Renter) && user.PersonId != null)
            {
                var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.PersonId == user.PersonId);
                if (tenant != null)
                {
                    query = query.Where(p => p.TenantId == tenant.Id);
                }
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

    #region Email Notifications

    private async Task SendPaymentConfirmationEmailAsync(Payment payment)
    {
        try
        {
            // Get tenant details
            var tenant = await _context.Tenants
                .Include(t => t.Person)
                .FirstOrDefaultAsync(t => t.Id == payment.TenantId);

            if (tenant?.Person == null)
            {
                _logger.LogWarning("Cannot send payment confirmation email: Tenant or Person not found for payment {PaymentId}", payment.Id);
                return;
            }

            // Get property details
            var property = await _context.Properties
                .FirstOrDefaultAsync(p => p.Id == tenant.PropertyId);

            if (property == null)
            {
                _logger.LogWarning("Cannot send payment confirmation email: Property not found for tenant {TenantId}", tenant.Id);
                return;
            }

            // Get property owner details
            var propertyOwner = await _context.PropertyOwners
                .Include(po => po.PersonOwners)
                .FirstOrDefaultAsync(po => po.PropertyId == property.Id);

            var ownerPerson = propertyOwner?.PersonOwners.FirstOrDefault();

            // Format payment method display
            var paymentMethodDisplay = payment.Method switch
            {
                PaymentMethod.CreditCard => "Credit Card",
                PaymentMethod.DebitCard => "Debit Card",
                PaymentMethod.CardOnline => !string.IsNullOrEmpty(payment.ExternalTransactionId) ? $"Card ending in {payment.ExternalTransactionId.Substring(Math.Max(0, payment.ExternalTransactionId.Length - 4))}" : "Online Card",
                PaymentMethod.Online => "Online Payment",
                PaymentMethod.BankTransfer => "Bank Transfer",
                PaymentMethod.Cash => "Cash",
                PaymentMethod.Check => "Check",
                _ => payment.Method.ToString()
            };

            // Get the user account associated with this tenant
            var tenantUser = await _context.Users
                .FirstOrDefaultAsync(u => u.PersonId == tenant.PersonId);

            if (tenantUser == null)
            {
                _logger.LogWarning("Cannot send payment confirmation email: User account not found for tenant {TenantId}", tenant.Id);
                return;
            }

            // Get the owner user account
            var ownerUser = ownerPerson != null ? await _context.Users
                .FirstOrDefaultAsync(u => u.PersonId == ownerPerson.Id) : null;

            // Prepare email data
            var emailData = new PaymentConfirmationEmailData
            {
                TenantFirstName = tenant.Person?.FirstName ?? tenant.Email.Split('@')[0],
                TenantEmail = tenant.Email,
                PropertyAddress = property.Address,
                Amount = payment.Amount,
                PaymentDate = payment.ProcessedAt?.ToString("MMMM d, yyyy") ?? payment.Date.ToString("MMMM d, yyyy"),
                TransactionId = payment.ExternalTransactionId ?? payment.Id,
                PaymentReference = payment.PaymentReference ?? $"PAY-{payment.Id.Substring(0, 8).ToUpper()}",
                PaymentMethodDisplay = paymentMethodDisplay,
                OwnerName = ownerPerson != null ? $"{ownerPerson.FirstName} {ownerPerson.LastName}" : "Property Owner",
                OwnerEmail = ownerUser?.Email ?? "support@rentflow.ro",
                FrontendUrl = _configuration["FrontendUrl"] ?? "https://rentflow.ro"
            };

            // Render email templates
            var (htmlBody, textBody) = await _emailTemplateService.RenderPaymentConfirmationEmailAsync(emailData);

            // Send email
            var subject = $"Payment Received: {emailData.Amount:N0} RON for {property.Address} - {emailData.PaymentDate}";

            await _emailService.SendHtmlEmailAsync(
                to: tenant.Email,
                subject: subject,
                htmlBody: htmlBody,
                textBody: textBody
            );

            _logger.LogInformation("Payment confirmation email sent successfully for payment {PaymentId} to {Email}",
                payment.Id, tenant.Email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send payment confirmation email for payment {PaymentId}", payment.Id);
            // Don't throw - email failure shouldn't break payment processing
        }
    }

    #endregion

    #region Private Helper Methods

    private async Task<bool> CanAccessPayment(Payment payment, User user)
    {
        if (user.HasRole(Role.Admin))
            return true;

        if (user.HasRole(Role.Renter) && user.PersonId != null)
        {
            var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.PersonId == user.PersonId);
            if (tenant != null && tenant.Id == payment.TenantId)
                return true;
        }

        if (user.HasRole(Role.PropertyOwner) && user.PersonId != null)
        {
            var tenant = await _context.Tenants.FindAsync(payment.TenantId);
            if (tenant != null)
            {
                var ownsProperty = await _context.PropertyOwners
                    .AnyAsync(po => po.PropertyId == tenant.PropertyId &&
                                   po.PersonOwners.Any(p => p.Id == user.PersonId));
                if (ownsProperty)
                    return true;
            }
        }

        return false;
    }

    private async Task<bool> CanAccessTenant(string tenantId, User user)
    {
        if (user.HasRole(Role.Admin))
            return true;

        if (user.HasRole(Role.Renter) && user.PersonId != null)
        {
            var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.PersonId == user.PersonId);
            if (tenant != null && tenant.Id == tenantId)
                return true;
        }

        if (user.HasRole(Role.PropertyOwner) && user.PersonId != null)
        {
            var tenant = await _context.Tenants.FindAsync(tenantId);
            if (tenant != null)
            {
                var ownsProperty = await _context.PropertyOwners
                    .AnyAsync(po => po.PropertyId == tenant.PropertyId &&
                                   po.PersonOwners.Any(p => p.Id == user.PersonId));
                if (ownsProperty)
                    return true;
            }
        }

        return false;
    }

    private async Task<bool> CanAccessProperty(string propertyId, User user)
    {
        if (user.HasRole(Role.Admin))
            return true;

        if (user.HasRole(Role.PropertyOwner) && user.PersonId != null)
        {
            var ownsProperty = await _context.PropertyOwners
                .AnyAsync(po => po.PropertyId == propertyId &&
                               po.PersonOwners.Any(p => p.Id == user.PersonId));
            if (ownsProperty)
                return true;
        }

        if (user.HasRole(Role.Renter) && user.PersonId != null)
        {
            var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.PersonId == user.PersonId);
            if (tenant != null && tenant.PropertyId == propertyId)
                return true;
        }

        return false;
    }

    #endregion
}
