using Microsoft.Extensions.Options;
using RentManager.API.Models;
using Stripe;

namespace RentManager.API.Services.PaymentGateway;

/// <summary>
/// Stripe payment gateway implementation
/// </summary>
public class StripePaymentGateway : IPaymentGateway
{
    private readonly StripeSettings _settings;
    private readonly ILogger<StripePaymentGateway> _logger;

    public string ProviderName => "Stripe";

    public StripePaymentGateway(IOptions<StripeSettings> settings, ILogger<StripePaymentGateway> logger)
    {
        _settings = settings.Value;
        _logger = logger;

        // Configure Stripe API key
        StripeConfiguration.ApiKey = _settings.SecretKey;
    }

    public async Task<PaymentGatewayResponse> CreatePaymentIntentAsync(Payment payment, Tenant tenant)
    {
        try
        {
            var options = new PaymentIntentCreateOptions
            {
                Amount = ConvertToSmallestUnit(payment.Amount),
                Currency = _settings.Currency,
                Description = $"Rent payment for {GetTenantName(tenant)} - {payment.Date:MMMM yyyy}",
                Metadata = new Dictionary<string, string>
                {
                    { "payment_id", payment.Id },
                    { "tenant_id", payment.TenantId },
                    { "payment_reference", payment.PaymentReference ?? "" }
                },
                AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
                {
                    Enabled = true,
                },
            };

            var service = new PaymentIntentService();
            var paymentIntent = await service.CreateAsync(options);

            _logger.LogInformation("Stripe payment intent created: {PaymentIntentId} for payment: {PaymentId}",
                paymentIntent.Id, payment.Id);

            return new PaymentGatewayResponse
            {
                Success = true,
                TransactionId = paymentIntent.Id,
                Status = MapStripeStatus(paymentIntent.Status),
                ClientSecret = paymentIntent.ClientSecret,
                ProcessedAt = DateTime.UtcNow,
                Metadata = new Dictionary<string, object>
                {
                    { "stripe_payment_intent_id", paymentIntent.Id },
                    { "stripe_status", paymentIntent.Status }
                }
            };
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe error creating payment intent for payment: {PaymentId}", payment.Id);

            return new PaymentGatewayResponse
            {
                Success = false,
                Status = PaymentStatus.Failed,
                ErrorMessage = ex.Message,
                ErrorCode = ex.StripeError?.Code
            };
        }
    }

    public async Task<PaymentGatewayResponse> ProcessPaymentAsync(Payment payment, Tenant tenant, string? paymentMethodId = null)
    {
        try
        {
            // If we already have a payment intent ID, just confirm it
            if (!string.IsNullOrEmpty(payment.ExternalTransactionId))
            {
                var service = new PaymentIntentService();
                var paymentIntent = await service.GetAsync(payment.ExternalTransactionId);

                return new PaymentGatewayResponse
                {
                    Success = paymentIntent.Status == "succeeded",
                    TransactionId = paymentIntent.Id,
                    Status = MapStripeStatus(paymentIntent.Status),
                    ProcessedAt = DateTime.UtcNow,
                    ProcessingFee = CalculateStripeFee(payment.Amount)
                };
            }

            // Create new payment intent
            var options = new PaymentIntentCreateOptions
            {
                Amount = ConvertToSmallestUnit(payment.Amount),
                Currency = _settings.Currency,
                Description = $"Rent payment for {GetTenantName(tenant)}",
                Metadata = new Dictionary<string, string>
                {
                    { "payment_id", payment.Id },
                    { "tenant_id", payment.TenantId }
                },
                Confirm = true,
                AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
                {
                    Enabled = true,
                    AllowRedirects = "never"
                }
            };

            if (!string.IsNullOrEmpty(paymentMethodId))
            {
                options.PaymentMethod = paymentMethodId;
                options.AutomaticPaymentMethods = null;
            }

            var intentService = new PaymentIntentService();
            var intent = await intentService.CreateAsync(options);

            _logger.LogInformation("Stripe payment processed: {PaymentIntentId} for payment: {PaymentId}",
                intent.Id, payment.Id);

            return new PaymentGatewayResponse
            {
                Success = intent.Status == "succeeded",
                TransactionId = intent.Id,
                Status = MapStripeStatus(intent.Status),
                ProcessedAt = DateTime.UtcNow,
                ProcessingFee = CalculateStripeFee(payment.Amount)
            };
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe error processing payment: {PaymentId}", payment.Id);

            return new PaymentGatewayResponse
            {
                Success = false,
                Status = PaymentStatus.Failed,
                ErrorMessage = ex.Message,
                ErrorCode = ex.StripeError?.Code
            };
        }
    }

    public async Task<PaymentGatewayResponse> ConfirmPaymentAsync(Payment payment, string confirmationData)
    {
        try
        {
            var service = new PaymentIntentService();
            var paymentIntent = await service.ConfirmAsync(payment.ExternalTransactionId);

            _logger.LogInformation("Stripe payment confirmed: {PaymentIntentId}", paymentIntent.Id);

            return new PaymentGatewayResponse
            {
                Success = paymentIntent.Status == "succeeded",
                TransactionId = paymentIntent.Id,
                Status = MapStripeStatus(paymentIntent.Status),
                ProcessedAt = DateTime.UtcNow,
                ConfirmationCode = confirmationData
            };
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe error confirming payment: {PaymentId}", payment.Id);

            return new PaymentGatewayResponse
            {
                Success = false,
                Status = PaymentStatus.Failed,
                ErrorMessage = ex.Message,
                ErrorCode = ex.StripeError?.Code
            };
        }
    }

    public async Task<PaymentGatewayResponse> RefundPaymentAsync(Payment payment, decimal? amount = null, string? reason = null)
    {
        try
        {
            var options = new RefundCreateOptions
            {
                PaymentIntent = payment.ExternalTransactionId,
                Reason = MapRefundReason(reason)
            };

            if (amount.HasValue)
            {
                options.Amount = ConvertToSmallestUnit(amount.Value);
            }

            var service = new RefundService();
            var refund = await service.CreateAsync(options);

            _logger.LogInformation("Stripe refund created: {RefundId} for payment: {PaymentId}",
                refund.Id, payment.Id);

            return new PaymentGatewayResponse
            {
                Success = refund.Status == "succeeded",
                TransactionId = refund.Id,
                Status = PaymentStatus.Refunded,
                ProcessedAt = DateTime.UtcNow
            };
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe error refunding payment: {PaymentId}", payment.Id);

            return new PaymentGatewayResponse
            {
                Success = false,
                Status = PaymentStatus.Failed,
                ErrorMessage = ex.Message,
                ErrorCode = ex.StripeError?.Code
            };
        }
    }

    public async Task<PaymentGatewayResponse> CancelPaymentAsync(Payment payment, string reason)
    {
        try
        {
            var service = new PaymentIntentService();
            var options = new PaymentIntentCancelOptions
            {
                CancellationReason = "requested_by_customer"
            };

            var paymentIntent = await service.CancelAsync(payment.ExternalTransactionId, options);

            _logger.LogInformation("Stripe payment cancelled: {PaymentIntentId}", paymentIntent.Id);

            return new PaymentGatewayResponse
            {
                Success = true,
                TransactionId = paymentIntent.Id,
                Status = PaymentStatus.Cancelled,
                ProcessedAt = DateTime.UtcNow
            };
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe error cancelling payment: {PaymentId}", payment.Id);

            return new PaymentGatewayResponse
            {
                Success = false,
                Status = PaymentStatus.Failed,
                ErrorMessage = ex.Message,
                ErrorCode = ex.StripeError?.Code
            };
        }
    }

    public async Task<bool> VerifyWebhookSignatureAsync(string payload, string signature)
    {
        try
        {
            var stripeEvent = EventUtility.ConstructEvent(
                payload,
                signature,
                _settings.WebhookSecret
            );

            return await Task.FromResult(true);
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe webhook signature verification failed");
            return false;
        }
    }

    public async Task<string> CreateCustomerAsync(Tenant tenant)
    {
        try
        {
            var options = new CustomerCreateOptions
            {
                Email = tenant.Email,
                Phone = tenant.Phone,
                Name = GetTenantName(tenant),
                Metadata = new Dictionary<string, string>
                {
                    { "tenant_id", tenant.Id },
                    { "property_id", tenant.PropertyId }
                }
            };

            var service = new CustomerService();
            var customer = await service.CreateAsync(options);

            _logger.LogInformation("Stripe customer created: {CustomerId} for tenant: {TenantId}",
                customer.Id, tenant.Id);

            return customer.Id;
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe error creating customer for tenant: {TenantId}", tenant.Id);
            throw;
        }
    }

    public async Task<PaymentGatewayResponse> GetPaymentStatusAsync(string externalTransactionId)
    {
        try
        {
            var service = new PaymentIntentService();
            var paymentIntent = await service.GetAsync(externalTransactionId);

            return new PaymentGatewayResponse
            {
                Success = paymentIntent.Status == "succeeded",
                TransactionId = paymentIntent.Id,
                Status = MapStripeStatus(paymentIntent.Status),
                ProcessedAt = paymentIntent.Created
            };
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe error getting payment status: {TransactionId}", externalTransactionId);

            return new PaymentGatewayResponse
            {
                Success = false,
                Status = PaymentStatus.Failed,
                ErrorMessage = ex.Message,
                ErrorCode = ex.StripeError?.Code
            };
        }
    }

    #region Helper Methods

    private long ConvertToSmallestUnit(decimal amount)
    {
        // For RON, EUR, USD, etc., smallest unit is cents
        return (long)(amount * 100);
    }

    private decimal CalculateStripeFee(decimal amount)
    {
        // Stripe fees: 2.9% + 0.30 EUR (approximate for RON)
        // This is an estimate; actual fees may vary
        return (amount * 0.029m) + 0.30m;
    }

    private PaymentStatus MapStripeStatus(string stripeStatus)
    {
        return stripeStatus switch
        {
            "succeeded" => PaymentStatus.Completed,
            "processing" => PaymentStatus.Processing,
            "requires_payment_method" => PaymentStatus.Pending,
            "requires_confirmation" => PaymentStatus.Pending,
            "requires_action" => PaymentStatus.Pending,
            "canceled" => PaymentStatus.Cancelled,
            "requires_capture" => PaymentStatus.Processing,
            _ => PaymentStatus.Failed
        };
    }

    private string MapRefundReason(string? reason)
    {
        if (string.IsNullOrEmpty(reason))
            return "requested_by_customer";

        // Stripe accepts: duplicate, fraudulent, requested_by_customer
        return reason.ToLower() switch
        {
            var r when r.Contains("duplicate") => "duplicate",
            var r when r.Contains("fraud") => "fraudulent",
            _ => "requested_by_customer"
        };
    }

    private string GetTenantName(Tenant tenant)
    {
        if (tenant.TenantType == TenantType.Person && tenant.Person != null)
        {
            return tenant.Person.FullName;
        }
        else if (tenant.TenantType == TenantType.Company && tenant.CompanyDetails != null)
        {
            return tenant.CompanyDetails.CompanyName ?? "Company Tenant";
        }

        return "Tenant";
    }

    #endregion
}

/// <summary>
/// Stripe configuration settings
/// </summary>
public class StripeSettings
{
    public string SecretKey { get; set; } = string.Empty;
    public string PublishableKey { get; set; } = string.Empty;
    public string WebhookSecret { get; set; } = string.Empty;
    public string Currency { get; set; } = "ron";
    public bool EnableTestMode { get; set; } = true;
}
