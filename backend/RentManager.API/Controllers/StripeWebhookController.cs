using Microsoft.AspNetCore.Mvc;
using RentManager.API.Models;
using RentManager.API.Services;
using RentManager.API.Services.PaymentGateway;
using Stripe;

namespace RentManager.API.Controllers;

[ApiController]
[Route("api/webhooks/stripe")]
public class StripeWebhookController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly IPaymentGateway _paymentGateway;
    private readonly ILogger<StripeWebhookController> _logger;

    public StripeWebhookController(
        IPaymentService paymentService,
        IPaymentGateway paymentGateway,
        ILogger<StripeWebhookController> logger)
    {
        _paymentService = paymentService;
        _paymentGateway = paymentGateway;
        _logger = logger;
    }

    /// <summary>
    /// Stripe webhook endpoint for payment events
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> HandleWebhook()
    {
        var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
        var signatureHeader = Request.Headers["Stripe-Signature"].ToString();

        try
        {
            // Verify webhook signature
            var isValid = await _paymentGateway.VerifyWebhookSignatureAsync(json, signatureHeader);
            if (!isValid)
            {
                _logger.LogWarning("Invalid Stripe webhook signature");
                return BadRequest("Invalid signature");
            }

            var stripeEvent = EventUtility.ParseEvent(json);

            _logger.LogInformation("Stripe webhook received: {EventType}", stripeEvent.Type);

            // Handle different event types
            switch (stripeEvent.Type)
            {
                case "payment_intent.succeeded":
                    await HandlePaymentIntentSucceeded(stripeEvent);
                    break;

                case "payment_intent.payment_failed":
                    await HandlePaymentIntentFailed(stripeEvent);
                    break;

                case "payment_intent.canceled":
                    await HandlePaymentIntentCanceled(stripeEvent);
                    break;

                case "charge.refunded":
                    await HandleChargeRefunded(stripeEvent);
                    break;

                case "payment_intent.processing":
                    await HandlePaymentIntentProcessing(stripeEvent);
                    break;

                default:
                    _logger.LogInformation("Unhandled Stripe event type: {EventType}", stripeEvent.Type);
                    break;
            }

            return Ok();
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe webhook error");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing Stripe webhook");
            return StatusCode(500, "Internal server error");
        }
    }

    private async Task HandlePaymentIntentSucceeded(Event stripeEvent)
    {
        var paymentIntent = stripeEvent.Data.Object as PaymentIntent;
        if (paymentIntent == null)
            return;

        var paymentId = paymentIntent.Metadata.GetValueOrDefault("payment_id");
        if (string.IsNullOrEmpty(paymentId))
        {
            _logger.LogWarning("Payment ID not found in Stripe payment intent metadata");
            return;
        }

        var payment = await _paymentService.GetPaymentAsync(paymentId);
        if (payment == null)
        {
            _logger.LogWarning("Payment not found: {PaymentId}", paymentId);
            return;
        }

        if (payment.Status != PaymentStatus.Completed)
        {
            payment.Status = PaymentStatus.Completed;
            payment.ProcessedAt = DateTimeOffset.UtcNow;
            payment.ExternalTransactionId = paymentIntent.Id;
            payment.UpdatedAt = DateTimeOffset.UtcNow;

            await _paymentService.UpdatePaymentAsync(payment.Id, payment);

            _logger.LogInformation("Payment marked as completed from Stripe webhook: {PaymentId}", paymentId);
        }
    }

    private async Task HandlePaymentIntentFailed(Event stripeEvent)
    {
        var paymentIntent = stripeEvent.Data.Object as PaymentIntent;
        if (paymentIntent == null)
            return;

        var paymentId = paymentIntent.Metadata.GetValueOrDefault("payment_id");
        if (string.IsNullOrEmpty(paymentId))
            return;

        var payment = await _paymentService.GetPaymentAsync(paymentId);
        if (payment == null)
            return;

        payment.Status = PaymentStatus.Failed;
        payment.FailureReason = paymentIntent.LastPaymentError?.Message ?? "Payment failed";
        payment.UpdatedAt = DateTimeOffset.UtcNow;

        await _paymentService.UpdatePaymentAsync(payment.Id, payment);

        _logger.LogInformation("Payment marked as failed from Stripe webhook: {PaymentId}", paymentId);
    }

    private async Task HandlePaymentIntentCanceled(Event stripeEvent)
    {
        var paymentIntent = stripeEvent.Data.Object as PaymentIntent;
        if (paymentIntent == null)
            return;

        var paymentId = paymentIntent.Metadata.GetValueOrDefault("payment_id");
        if (string.IsNullOrEmpty(paymentId))
            return;

        var payment = await _paymentService.GetPaymentAsync(paymentId);
        if (payment == null)
            return;

        await _paymentService.CancelPaymentAsync(payment.Id, "Cancelled via Stripe");

        _logger.LogInformation("Payment cancelled from Stripe webhook: {PaymentId}", paymentId);
    }

    private async Task HandleChargeRefunded(Event stripeEvent)
    {
        var charge = stripeEvent.Data.Object as Charge;
        if (charge == null)
            return;

        // Find payment by external transaction ID
        var payments = await _paymentService.GetPaymentsAsync();
        var payment = payments.FirstOrDefault(p => p.ExternalTransactionId == charge.PaymentIntentId);

        if (payment == null)
        {
            _logger.LogWarning("Payment not found for Stripe charge: {ChargeId}", charge.Id);
            return;
        }

        if (!payment.IsRefunded)
        {
            // Mark as refunded - the actual refund payment was already created by RefundPaymentAsync
            payment.IsRefunded = true;
            payment.UpdatedAt = DateTimeOffset.UtcNow;

            await _paymentService.UpdatePaymentAsync(payment.Id, payment);

            _logger.LogInformation("Payment marked as refunded from Stripe webhook: {PaymentId}", payment.Id);
        }
    }

    private async Task HandlePaymentIntentProcessing(Event stripeEvent)
    {
        var paymentIntent = stripeEvent.Data.Object as PaymentIntent;
        if (paymentIntent == null)
            return;

        var paymentId = paymentIntent.Metadata.GetValueOrDefault("payment_id");
        if (string.IsNullOrEmpty(paymentId))
            return;

        var payment = await _paymentService.GetPaymentAsync(paymentId);
        if (payment == null)
            return;

        if (payment.Status == PaymentStatus.Pending)
        {
            payment.Status = PaymentStatus.Processing;
            payment.UpdatedAt = DateTimeOffset.UtcNow;

            await _paymentService.UpdatePaymentAsync(payment.Id, payment);

            _logger.LogInformation("Payment marked as processing from Stripe webhook: {PaymentId}", paymentId);
        }
    }
}
