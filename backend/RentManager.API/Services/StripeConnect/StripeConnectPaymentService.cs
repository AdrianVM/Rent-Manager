using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using RentManager.API.Data;
using RentManager.API.Models;
using RentManager.API.Services.PaymentGateway;
using Stripe;
using System.Text.Json;

namespace RentManager.API.Services.StripeConnect;

/// <summary>
/// Enhanced payment service that handles payments with Stripe Connect
/// Manages payment flow: Tenant -> Platform -> Property Owner with fee distribution
/// </summary>
public class StripeConnectPaymentService
{
    private readonly IUnitOfWork _context;
    private readonly ILogger<StripeConnectPaymentService> _logger;
    private readonly StripeSettings _stripeSettings;
    private readonly IStripeConnectService _connectService;

    public StripeConnectPaymentService(
        IUnitOfWork context,
        ILogger<StripeConnectPaymentService> logger,
        IOptions<StripeSettings> stripeSettings,
        IStripeConnectService connectService)
    {
        _context = context;
        _logger = logger;
        _stripeSettings = stripeSettings.Value;
        _connectService = connectService;

        StripeConfiguration.ApiKey = _stripeSettings.SecretKey;
    }

    /// <summary>
    /// Create a payment intent with automatic transfer to connected account
    /// Platform collects payment, retains fee, and transfers remainder to property owner
    /// </summary>
    public async Task<PaymentGatewayResponse> CreateConnectPaymentIntentAsync(
        Payment payment,
        Tenant tenant,
        string propertyOwnerId,
        decimal platformFeeAmount)
    {
        try
        {
            // Get the connected account for the property owner
            var connectAccount = await _connectService.GetAccountByPropertyOwnerIdAsync(propertyOwnerId);
            if (connectAccount == null)
            {
                throw new InvalidOperationException($"Property owner {propertyOwnerId} does not have a Stripe Connect account. They must complete onboarding first.");
            }

            if (!connectAccount.CanAcceptPayments || connectAccount.Status != StripeAccountStatus.Active)
            {
                throw new InvalidOperationException($"Property owner's Stripe account is not active. Status: {connectAccount.Status}");
            }

            // Calculate transfer amount (payment minus platform fee)
            var transferAmount = payment.Amount - platformFeeAmount;
            if (transferAmount <= 0)
            {
                throw new InvalidOperationException("Transfer amount must be greater than 0 after platform fee deduction");
            }

            // Create payment intent with application_fee_amount (destination charge pattern)
            var options = new PaymentIntentCreateOptions
            {
                Amount = ConvertToSmallestUnit(payment.Amount),
                Currency = _stripeSettings.Currency,
                Description = $"Rent payment for {GetTenantName(tenant)} - {payment.Date:MMMM yyyy}",

                // Application fee is what the platform keeps
                ApplicationFeeAmount = ConvertToSmallestUnit(platformFeeAmount),

                // Transfer funds to connected account
                OnBehalfOf = connectAccount.StripeAccountId,
                TransferData = new PaymentIntentTransferDataOptions
                {
                    Destination = connectAccount.StripeAccountId,
                },

                AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
                {
                    Enabled = true,
                },

                Metadata = new Dictionary<string, string>
                {
                    { "payment_id", payment.Id },
                    { "tenant_id", payment.TenantId },
                    { "property_owner_id", propertyOwnerId },
                    { "platform_fee", platformFeeAmount.ToString("F2") },
                    { "transfer_amount", transferAmount.ToString("F2") },
                    { "payment_reference", payment.PaymentReference ?? "" }
                },

                // Receipt email
                ReceiptEmail = tenant.Email,
            };

            var service = new PaymentIntentService();
            var paymentIntent = await service.CreateAsync(options);

            _logger.LogInformation(
                "Stripe Connect payment intent created: {PaymentIntentId} for payment: {PaymentId}, " +
                "Amount: {Amount}, Platform Fee: {PlatformFee}, Transfer: {TransferAmount}, Destination: {Destination}",
                paymentIntent.Id, payment.Id, payment.Amount, platformFeeAmount, transferAmount, connectAccount.StripeAccountId);

            // Update payment record
            payment.StripeConnectAccountId = connectAccount.Id;
            payment.PlatformFee = platformFeeAmount;
            payment.TransferAmount = transferAmount;
            payment.ExternalTransactionId = paymentIntent.Id;
            payment.PaymentGatewayProvider = "Stripe Connect";

            return new PaymentGatewayResponse
            {
                Success = true,
                TransactionId = paymentIntent.Id,
                Status = MapStripeStatus(paymentIntent.Status),
                ClientSecret = paymentIntent.ClientSecret,
                ProcessedAt = DateTimeOffset.UtcNow,
                Metadata = new Dictionary<string, object>
                {
                    { "stripe_payment_intent_id", paymentIntent.Id },
                    { "stripe_status", paymentIntent.Status },
                    { "platform_fee", platformFeeAmount },
                    { "transfer_amount", transferAmount },
                    { "connected_account_id", connectAccount.StripeAccountId }
                }
            };
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe error creating Connect payment intent for payment: {PaymentId}", payment.Id);
            return new PaymentGatewayResponse
            {
                Success = false,
                Status = PaymentStatus.Failed,
                ErrorMessage = ex.Message,
                ErrorCode = ex.StripeError?.Code
            };
        }
    }

    /// <summary>
    /// Process webhook event for successful payment
    /// Creates transfer record for tracking
    /// </summary>
    public async Task<StripeTransfer> HandlePaymentSuccessWebhookAsync(PaymentIntent paymentIntent)
    {
        try
        {
            // Extract metadata
            var paymentId = paymentIntent.Metadata.GetValueOrDefault("payment_id");
            if (string.IsNullOrEmpty(paymentId))
            {
                throw new InvalidOperationException("Payment ID not found in payment intent metadata");
            }

            var payment = await _context.Payments.FindAsync(paymentId);
            if (payment == null)
            {
                throw new InvalidOperationException($"Payment {paymentId} not found");
            }

            // Update payment status
            payment.Status = PaymentStatus.Completed;
            payment.ProcessedAt = DateTimeOffset.UtcNow;
            payment.ExternalTransactionId = paymentIntent.Id;

            // Get Stripe processing fee
            var charges = paymentIntent.Charges?.Data;
            var stripeFee = 0m;
            if (charges?.Any() == true)
            {
                var charge = charges.First();
                stripeFee = charge.BalanceTransaction?.Fee / 100m ?? 0m;
            }
            payment.ProcessingFee = stripeFee;

            // Extract transfer information
            var transferId = paymentIntent.Transfer?.Id ?? paymentIntent.TransferData?.Destination;
            var platformFee = decimal.Parse(paymentIntent.Metadata.GetValueOrDefault("platform_fee", "0"));
            var transferAmount = decimal.Parse(paymentIntent.Metadata.GetValueOrDefault("transfer_amount", "0"));

            // Create transfer record
            var transfer = new StripeTransfer
            {
                Id = Guid.NewGuid().ToString(),
                PaymentId = payment.Id,
                StripeConnectAccountId = payment.StripeConnectAccountId!,
                StripeTransferId = transferId ?? "",
                StripePaymentIntentId = paymentIntent.Id,
                GrossAmount = payment.Amount,
                PlatformFee = platformFee,
                StripeFee = stripeFee,
                NetAmount = transferAmount,
                Status = StripeTransferStatus.Completed,
                TransferredAt = DateTimeOffset.UtcNow,
                Description = $"Rent payment transfer for payment {payment.Id}",
                IdempotencyKey = $"transfer_{payment.Id}_{paymentIntent.Id}",
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            _context.Set<StripeTransfer>().Add(transfer);

            // Update payment transfer tracking
            payment.TransferCompleted = true;
            payment.TransferredAt = DateTimeOffset.UtcNow;
            payment.StripeTransferId = transfer.Id;

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Transfer record created for payment: {PaymentId}, Transfer ID: {TransferId}, " +
                "Net Amount: {NetAmount}, Platform Fee: {PlatformFee}",
                payment.Id, transfer.Id, transfer.NetAmount, transfer.PlatformFee);

            return transfer;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling payment success webhook for payment intent: {PaymentIntentId}", paymentIntent.Id);
            throw;
        }
    }

    /// <summary>
    /// Calculate platform fee for a payment
    /// </summary>
    public async Task<FeeCalculationResult> CalculatePlatformFeeAsync(
        decimal paymentAmount,
        string propertyOwnerId,
        string? propertyId = null)
    {
        // Get applicable fee structure
        var feeStructure = await GetApplicableFeeStructureAsync(propertyOwnerId, propertyId, paymentAmount);

        if (feeStructure == null)
        {
            // Default fee if no structure found: 3% + 0.50 RON
            var defaultPlatformFee = (paymentAmount * 0.03m) + 0.50m;
            var defaultStripeFee = CalculateStripeFee(paymentAmount);
            var defaultNetAmount = paymentAmount - defaultPlatformFee;

            return new FeeCalculationResult
            {
                GrossAmount = paymentAmount,
                PlatformFee = defaultPlatformFee,
                StripeFee = defaultStripeFee,
                NetAmount = defaultNetAmount,
                FeeStructureId = "default",
                FeeStructureName = "Default Platform Fee",
                Calculation = $"Platform fee: 3% + 0.50 RON = {defaultPlatformFee:F2} RON"
            };
        }

        // Calculate fee based on structure
        decimal platformFee = 0m;
        string calculation = "";

        switch (feeStructure.FeeType)
        {
            case PlatformFeeType.Percentage:
                platformFee = paymentAmount * (feeStructure.PercentageFee / 100m);
                calculation = $"Platform fee: {feeStructure.PercentageFee}% of {paymentAmount:F2} = {platformFee:F2} RON";
                break;

            case PlatformFeeType.Fixed:
                platformFee = feeStructure.FixedFee;
                calculation = $"Platform fee: Fixed {platformFee:F2} RON";
                break;

            case PlatformFeeType.Hybrid:
                platformFee = (paymentAmount * (feeStructure.PercentageFee / 100m)) + feeStructure.FixedFee;
                calculation = $"Platform fee: {feeStructure.PercentageFee}% + {feeStructure.FixedFee:F2} = {platformFee:F2} RON";
                break;
        }

        // Apply min/max caps
        if (feeStructure.MinimumFee > 0 && platformFee < feeStructure.MinimumFee)
        {
            platformFee = feeStructure.MinimumFee;
            calculation += $" (minimum applied: {feeStructure.MinimumFee:F2} RON)";
        }

        if (feeStructure.MaximumFee > 0 && platformFee > feeStructure.MaximumFee)
        {
            platformFee = feeStructure.MaximumFee;
            calculation += $" (maximum cap applied: {feeStructure.MaximumFee:F2} RON)";
        }

        var stripeFee = CalculateStripeFee(paymentAmount);
        var netAmount = paymentAmount - platformFee;

        return new FeeCalculationResult
        {
            GrossAmount = paymentAmount,
            PlatformFee = platformFee,
            StripeFee = stripeFee,
            NetAmount = netAmount,
            FeeStructureId = feeStructure.Id,
            FeeStructureName = feeStructure.Name,
            Calculation = calculation
        };
    }

    /// <summary>
    /// Refund a Connect payment (reverses transfer if needed)
    /// </summary>
    public async Task<PaymentGatewayResponse> RefundConnectPaymentAsync(
        Payment payment,
        decimal? refundAmount = null,
        string? reason = null)
    {
        try
        {
            if (string.IsNullOrEmpty(payment.ExternalTransactionId))
            {
                throw new InvalidOperationException("Payment does not have an external transaction ID");
            }

            var amount = refundAmount ?? payment.Amount;

            var options = new RefundCreateOptions
            {
                PaymentIntent = payment.ExternalTransactionId,
                Amount = ConvertToSmallestUnit(amount),
                Reason = MapRefundReason(reason),
                ReverseTransfer = true, // This reverses the transfer to connected account
                Metadata = new Dictionary<string, string>
                {
                    { "payment_id", payment.Id },
                    { "refund_reason", reason ?? "requested_by_customer" }
                }
            };

            var service = new RefundService();
            var refund = await service.CreateAsync(options);

            _logger.LogInformation(
                "Refund created for Connect payment: {PaymentId}, Refund ID: {RefundId}, Amount: {Amount}",
                payment.Id, refund.Id, amount);

            // Update transfer record if exists
            if (!string.IsNullOrEmpty(payment.StripeTransferId))
            {
                var transfer = await _context.Set<StripeTransfer>()
                    .FirstOrDefaultAsync(t => t.Id == payment.StripeTransferId);

                if (transfer != null)
                {
                    transfer.IsReversed = true;
                    transfer.ReversalId = refund.Id;
                    transfer.ReversedAt = DateTimeOffset.UtcNow;
                    transfer.ReversalReason = reason;
                    transfer.Status = StripeTransferStatus.Reversed;
                    transfer.UpdatedAt = DateTimeOffset.UtcNow;

                    await _context.SaveChangesAsync();
                }
            }

            return new PaymentGatewayResponse
            {
                Success = refund.Status == "succeeded",
                TransactionId = refund.Id,
                Status = PaymentStatus.Refunded,
                ProcessedAt = DateTimeOffset.UtcNow
            };
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe error refunding Connect payment: {PaymentId}", payment.Id);
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

    private async Task<StripePlatformFee?> GetApplicableFeeStructureAsync(
        string propertyOwnerId,
        string? propertyId,
        decimal paymentAmount)
    {
        var query = _context.Set<StripePlatformFee>()
            .AsNoTracking()
            .Where(f => f.IsActive);

        // Filter by property if specified
        if (!string.IsNullOrEmpty(propertyId))
        {
            query = query.Where(f => f.PropertyId == null || f.PropertyId == propertyId);
        }

        // Filter by payment amount range
        query = query.Where(f =>
            (!f.MinPaymentAmount.HasValue || paymentAmount >= f.MinPaymentAmount.Value) &&
            (!f.MaxPaymentAmount.HasValue || paymentAmount <= f.MaxPaymentAmount.Value));

        // Filter by date validity
        var now = DateTimeOffset.UtcNow;
        query = query.Where(f =>
            (!f.ValidFrom.HasValue || now >= f.ValidFrom.Value) &&
            (!f.ValidTo.HasValue || now <= f.ValidTo.Value));

        // Get the most specific match (property-specific first, then default)
        var feeStructures = await query.OrderByDescending(f => f.PropertyId != null)
            .ThenByDescending(f => f.IsDefault)
            .ToListAsync();

        return feeStructures.FirstOrDefault();
    }

    private long ConvertToSmallestUnit(decimal amount)
    {
        return (long)(amount * 100);
    }

    private decimal CalculateStripeFee(decimal amount)
    {
        // Stripe fees for Romania: 2.9% + 1.00 RON (approximate)
        return (amount * 0.029m) + 1.00m;
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
        else if (tenant.TenantType == TenantType.Company && tenant.Company != null)
        {
            return tenant.Company.CompanyName ?? "Company Tenant";
        }

        return "Tenant";
    }

    #endregion
}
