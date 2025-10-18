using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentManager.API.Models;
using RentManager.API.Models.DTOs;
using RentManager.API.Services;
using System.Security.Claims;

namespace RentManager.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PaymentsController : ControllerBase
    {
        private readonly IPaymentService _paymentService;
        private readonly IAuthService _authService;
        private readonly ILogger<PaymentsController> _logger;

        public PaymentsController(
            IPaymentService paymentService,
            IAuthService authService,
            ILogger<PaymentsController> logger)
        {
            _paymentService = paymentService;
            _authService = authService;
            _logger = logger;
        }

        private async Task<User?> GetCurrentUserAsync()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return null;

            return await _authService.GetUserByIdAsync(userId);
        }

        #region Basic CRUD Operations

        [HttpGet]
        public async Task<ActionResult<List<Payment>>> GetPayments()
        {
            var currentUser = await GetCurrentUserAsync();
            var payments = await _paymentService.GetPaymentsAsync(currentUser);
            return Ok(payments);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Payment>> GetPayment(string id)
        {
            var currentUser = await GetCurrentUserAsync();
            var payment = await _paymentService.GetPaymentAsync(id, currentUser);
            if (payment == null)
            {
                return NotFound();
            }
            return Ok(payment);
        }

        [HttpGet("tenant/{tenantId}")]
        public async Task<ActionResult<List<Payment>>> GetPaymentsByTenant(string tenantId)
        {
            var currentUser = await GetCurrentUserAsync();
            var payments = await _paymentService.GetPaymentsByTenantAsync(tenantId, currentUser);
            return Ok(payments);
        }

        [HttpGet("property/{propertyId}")]
        public async Task<ActionResult<List<Payment>>> GetPaymentsByProperty(string propertyId)
        {
            var currentUser = await GetCurrentUserAsync();
            var payments = await _paymentService.GetPaymentsByPropertyAsync(propertyId, currentUser);
            return Ok(payments);
        }

        [HttpPost]
        public async Task<ActionResult<Payment>> CreatePayment(Payment payment)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var currentUser = await GetCurrentUserAsync();
            var createdPayment = await _paymentService.CreatePaymentAsync(payment, currentUser);
            return CreatedAtAction(nameof(GetPayment), new { id = createdPayment.Id }, createdPayment);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<Payment>> UpdatePayment(string id, Payment payment)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var currentUser = await GetCurrentUserAsync();
                var updatedPayment = await _paymentService.UpdatePaymentAsync(id, payment, currentUser);
                return Ok(updatedPayment);
            }
            catch (ArgumentException)
            {
                return NotFound();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePayment(string id)
        {
            var currentUser = await GetCurrentUserAsync();
            var success = await _paymentService.DeletePaymentAsync(id, currentUser);
            if (!success)
            {
                return NotFound();
            }

            return NoContent();
        }

        #endregion

        #region Payment Processing

        [HttpPost("initiate")]
        public async Task<ActionResult> InitiatePayment([FromBody] InitiatePaymentRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var currentUser = await GetCurrentUserAsync();
                var payment = await _paymentService.InitiatePaymentAsync(
                    request.TenantId,
                    request.Amount,
                    request.Method,
                    currentUser);

                if (!string.IsNullOrEmpty(request.BankIBAN))
                {
                    payment.BankIBAN = request.BankIBAN;
                    payment.BankAccountHolder = request.BankAccountHolder;
                    await _paymentService.UpdatePaymentAsync(payment.Id, payment, currentUser);
                }

                // For CardOnline payment method, create a Stripe PaymentIntent
                string? clientSecret = null;
                if (request.Method == PaymentMethod.CardOnline)
                {
                    var paymentIntentResponse = await _paymentService.CreatePaymentIntentAsync(payment.Id, currentUser);
                    clientSecret = paymentIntentResponse.ClientSecret;
                }

                return Ok(new
                {
                    paymentId = payment.Id,
                    amount = payment.Amount,
                    status = payment.Status.ToString(),
                    paymentReference = payment.PaymentReference,
                    clientSecret = clientSecret
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("process")]
        public async Task<ActionResult<Payment>> ProcessPayment([FromBody] ProcessPaymentRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var payment = await _paymentService.ProcessPaymentAsync(
                    request.PaymentId,
                    request.ExternalTransactionId);

                return Ok(payment);
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing payment {PaymentId}", request.PaymentId);
                return StatusCode(500, "An error occurred while processing the payment");
            }
        }

        [HttpPost("confirm")]
        public async Task<ActionResult<Payment>> ConfirmPayment([FromBody] ConfirmPaymentRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var payment = await _paymentService.ConfirmPaymentAsync(
                    request.PaymentId,
                    request.ConfirmationCode);

                return Ok(payment);
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpPost("cancel")]
        public async Task<ActionResult<Payment>> CancelPayment([FromBody] CancelPaymentRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var payment = await _paymentService.CancelPaymentAsync(
                    request.PaymentId,
                    request.Reason);

                return Ok(payment);
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("refund")]
        public async Task<ActionResult<Payment>> RefundPayment([FromBody] RefundPaymentRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var payment = await _paymentService.RefundPaymentAsync(
                    request.PaymentId,
                    request.Amount,
                    request.Reason);

                return Ok(payment);
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        #endregion

        #region Payment Reconciliation

        [HttpGet("pending")]
        public async Task<ActionResult<List<Payment>>> GetPendingPayments()
        {
            var currentUser = await GetCurrentUserAsync();
            var payments = await _paymentService.GetPendingPaymentsAsync(currentUser);
            return Ok(payments);
        }

        [HttpGet("failed")]
        public async Task<ActionResult<List<Payment>>> GetFailedPayments(
            [FromQuery] DateTime? from = null,
            [FromQuery] DateTime? to = null)
        {
            var payments = await _paymentService.GetFailedPaymentsAsync(from, to);
            return Ok(payments);
        }

        [HttpPost("reconcile")]
        public async Task<ActionResult<Payment>> ReconcilePayment([FromBody] ReconcilePaymentRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var payment = await _paymentService.ReconcilePaymentByReferenceAsync(
                request.PaymentReference,
                request.Amount,
                request.Date);

            if (payment == null)
            {
                return NotFound($"No pending payment found with reference {request.PaymentReference}");
            }

            return Ok(payment);
        }

        #endregion

        #region Recurring Payments

        [HttpPost("recurring/generate")]
        [Authorize(Roles = "Admin,PropertyOwner")]
        public async Task<ActionResult<List<Payment>>> GenerateRecurringPayments(
            [FromBody] GenerateRecurringPaymentsRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var forMonth = new DateTime(request.Year, request.Month, 1);
                var payments = await _paymentService.GenerateRecurringPaymentsAsync(forMonth);
                return Ok(payments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating recurring payments for {Year}-{Month}", request.Year, request.Month);
                return StatusCode(500, "An error occurred while generating recurring payments");
            }
        }

        [HttpGet("tenant/{tenantId}/last")]
        public async Task<ActionResult<Payment>> GetLastPaymentForTenant(string tenantId)
        {
            var payment = await _paymentService.GetLastPaymentForTenantAsync(tenantId);
            if (payment == null)
            {
                return NotFound();
            }
            return Ok(payment);
        }

        #endregion

        #region Romanian Specific

        [HttpGet("reference/generate")]
        public async Task<ActionResult<string>> GeneratePaymentReference(
            [FromQuery] string tenantId,
            [FromQuery] int year,
            [FromQuery] int month)
        {
            try
            {
                var forMonth = new DateTime(year, month, 1);
                var reference = await _paymentService.GenerateRomanianPaymentReferenceAsync(tenantId, forMonth);
                return Ok(new { reference });
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpPost("validate-iban")]
        public async Task<ActionResult<ValidateIBANResponse>> ValidateIBAN([FromBody] ValidateIBANRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var isValid = await _paymentService.ValidateIBANAsync(request.IBAN);

            return Ok(new ValidateIBANResponse
            {
                IsValid = isValid,
                ErrorMessage = isValid ? null : "Invalid Romanian IBAN format"
            });
        }

        #endregion

        #region Analytics and Reporting

        [HttpGet("statistics")]
        public async Task<ActionResult<PaymentStatisticsResponse>> GetPaymentStatistics(
            [FromQuery] DateTime? from = null,
            [FromQuery] DateTime? to = null)
        {
            var currentUser = await GetCurrentUserAsync();
            var fromDate = from ?? DateTime.UtcNow.AddMonths(-12);
            var toDate = to ?? DateTime.UtcNow;

            var totalCollected = await _paymentService.GetTotalCollectedAsync(fromDate, toDate, currentUser);
            var byMethod = await _paymentService.GetPaymentsByMethodAsync(fromDate, toDate, currentUser);
            var byStatus = await _paymentService.GetPaymentStatusDistributionAsync(currentUser);
            var allPayments = await _paymentService.GetPaymentsAsync(currentUser);

            var completedPayments = allPayments
                .Where(p => p.Status == PaymentStatus.Completed && p.Date >= fromDate && p.Date <= toDate)
                .ToList();

            var averagePayment = completedPayments.Any()
                ? completedPayments.Average(p => p.Amount)
                : 0;

            return Ok(new PaymentStatisticsResponse
            {
                TotalCollected = totalCollected,
                TotalPayments = completedPayments.Count,
                ByMethod = byMethod,
                ByStatus = byStatus,
                AveragePayment = averagePayment
            });
        }

        [HttpGet("total-collected")]
        public async Task<ActionResult<decimal>> GetTotalCollected(
            [FromQuery] DateTime? from = null,
            [FromQuery] DateTime? to = null)
        {
            var currentUser = await GetCurrentUserAsync();
            var total = await _paymentService.GetTotalCollectedAsync(from, to, currentUser);
            return Ok(new { total });
        }

        [HttpGet("stripe-config")]
        [AllowAnonymous]
        public ActionResult GetStripeConfig([FromServices] IConfiguration configuration)
        {
            var publishableKey = configuration["Stripe:PublishableKey"];
            return Ok(new { publishableKey });
        }

        #endregion
    }
}