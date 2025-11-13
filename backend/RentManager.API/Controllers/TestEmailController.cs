using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentManager.API.Models;
using RentManager.API.Services;
using RentManager.API.Services.Email;
using System.ComponentModel.DataAnnotations;

namespace RentManager.API.Controllers;

[ApiController]
[Route("api/test-email")]
[Authorize(Roles = "Admin")]
public class TestEmailController : ControllerBase
{
    private readonly IBackgroundEmailService _backgroundEmailService;
    private readonly IConfiguration _configuration;
    private readonly IDataService _dataService;
    private readonly ILogger<TestEmailController> _logger;

    public TestEmailController(
        IBackgroundEmailService backgroundEmailService,
        IConfiguration configuration,
        IDataService dataService,
        ILogger<TestEmailController> logger)
    {
        _backgroundEmailService = backgroundEmailService;
        _configuration = configuration;
        _dataService = dataService;
        _logger = logger;
    }

    [HttpPost("tenant-invitation")]
    public async Task<IActionResult> SendTestTenantInvitation([FromBody] TestTemplateEmailRequest request)
    {
        try
        {
            var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:3000";
            var token = Guid.NewGuid().ToString();

            var emailData = new TenantInvitationEmailData
            {
                TenantFirstName = "Test User",
                TenantEmail = request.RecipientEmail,
                OwnerName = "Test Property Owner",
                OwnerEmail = "owner@example.com",
                OwnerPhone = "+40 123 456 789",
                PropertyName = "Modern Downtown Apartment",
                PropertyAddress = "123 Main Street, Apt 4B, Bucharest, Romania",
                PropertyType = "Apartment",
                RentAmount = 2500.00m,
                LeaseStartDate = DateTime.UtcNow.AddDays(14).ToString("dd.MM.yyyy"),
                OnboardingUrl = $"{frontendUrl}/tenant-onboarding/{token}",
                ExpirationDate = DateTime.UtcNow.AddDays(7).ToString("dd.MM.yyyy"),
                FrontendUrl = frontendUrl
            };

            var subject = $"You're invited to {emailData.PropertyName} - Complete Your Tenant Onboarding";
            var jobId = _backgroundEmailService.EnqueueTenantInvitationEmail(emailData, subject);

            _logger.LogInformation("Test tenant invitation email enqueued (JobId: {JobId}) to {Email}", jobId, request.RecipientEmail);

            return await Task.FromResult(Ok(new
            {
                success = true,
                message = $"Tenant invitation test email queued successfully",
                jobId = jobId,
                recipientEmail = request.RecipientEmail
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send test tenant invitation email");
            return await Task.FromResult(StatusCode(500, new { success = false, message = "Failed to send test email", error = ex.Message }));
        }
    }

    [HttpPost("payment-confirmation")]
    public async Task<IActionResult> SendTestPaymentConfirmation([FromBody] TestTemplateEmailRequest request)
    {
        try
        {
            var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:3000";

            var emailData = new PaymentConfirmationEmailData
            {
                TenantFirstName = "Test User",
                TenantEmail = request.RecipientEmail,
                PropertyAddress = "123 Main Street, Apt 4B, Bucharest, Romania",
                Amount = 2500.00m,
                PaymentDate = DateTime.UtcNow.ToString("MMMM d, yyyy"),
                TransactionId = "TEST-" + Guid.NewGuid().ToString().Substring(0, 8).ToUpper(),
                PaymentReference = "RENT-" + DateTime.UtcNow.ToString("yyyyMM") + "-TESTPAY",
                PaymentMethodDisplay = "Online Card ending in 4242",
                OwnerName = "Test Property Owner",
                OwnerEmail = "owner@example.com",
                FrontendUrl = frontendUrl
            };

            var subject = $"Payment Received: {emailData.Amount:N0} RON for {emailData.PropertyAddress} - {emailData.PaymentDate}";
            var jobId = _backgroundEmailService.EnqueuePaymentConfirmationEmail(emailData, subject);

            _logger.LogInformation("Test payment confirmation email enqueued (JobId: {JobId}) to {Email}", jobId, request.RecipientEmail);

            return await Task.FromResult(Ok(new
            {
                success = true,
                message = $"Payment confirmation test email queued successfully",
                jobId = jobId,
                recipientEmail = request.RecipientEmail
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send test payment confirmation email");
            return await Task.FromResult(StatusCode(500, new { success = false, message = "Failed to send test email", error = ex.Message }));
        }
    }

    [HttpPost("contract-upload")]
    public async Task<IActionResult> SendTestContractUpload([FromBody] TestTemplateEmailRequest request)
    {
        try
        {
            var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:3000";

            var emailData = new ContractUploadEmailData
            {
                TenantFirstName = "Test User",
                TenantEmail = request.RecipientEmail,
                PropertyAddress = "123 Main Street, Apt 4B, Bucharest, Romania",
                ContractType = "Lease Agreement",
                UploadDate = DateTime.UtcNow.ToString("dd.MM.yyyy HH:mm"),
                UploadedBy = "Test Property Owner",
                ContractStatus = "Pending",
                ContractViewUrl = $"{frontendUrl}/contracts/test-contract-id",
                OwnerName = "Test Property Owner",
                OwnerEmail = "owner@example.com",
                OwnerPhone = "+40 123 456 789",
                FrontendUrl = frontendUrl
            };

            var subject = $"Action Required: New Contract for {emailData.PropertyAddress}";
            var jobId = _backgroundEmailService.EnqueueContractUploadEmail(emailData, subject);

            _logger.LogInformation("Test contract upload email enqueued (JobId: {JobId}) to {Email}", jobId, request.RecipientEmail);

            return await Task.FromResult(Ok(new
            {
                success = true,
                message = $"Contract upload test email queued successfully",
                jobId = jobId,
                recipientEmail = request.RecipientEmail
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send test contract upload email");
            return await Task.FromResult(StatusCode(500, new { success = false, message = "Failed to send test email", error = ex.Message }));
        }
    }

    [HttpPost("welcome")]
    public async Task<IActionResult> SendTestWelcome([FromBody] TestTemplateEmailRequest request)
    {
        try
        {
            var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:3000";

            var emailData = new WelcomeEmailData
            {
                TenantFirstName = "Test User",
                TenantEmail = request.RecipientEmail,
                PropertyAddress = "123 Main Street, Apt 4B, Bucharest, Romania",
                OwnerName = "Test Property Owner",
                OwnerEmail = "owner@example.com",
                OwnerPhone = "+40 123 456 789",
                FrontendUrl = frontendUrl
            };

            var subject = $"Welcome to Rent Manager, {emailData.TenantFirstName}! Your Tenant Portal is Ready";
            var jobId = _backgroundEmailService.EnqueueWelcomeEmail(emailData, subject);

            _logger.LogInformation("Test welcome email enqueued (JobId: {JobId}) to {Email}", jobId, request.RecipientEmail);

            return await Task.FromResult(Ok(new
            {
                success = true,
                message = $"Welcome test email queued successfully",
                jobId = jobId,
                recipientEmail = request.RecipientEmail
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send test welcome email");
            return await Task.FromResult(StatusCode(500, new { success = false, message = "Failed to send test email", error = ex.Message }));
        }
    }

    [HttpPost("overdue-payment")]
    public async Task<IActionResult> SendTestOverduePayment([FromBody] TestTemplateEmailRequest request)
    {
        try
        {
            var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:3000";

            // Simulate a payment that's 3 days overdue
            var dueDate = DateTime.UtcNow.AddDays(-3);
            var daysOverdue = 3;
            var rentAmount = 2500.00m;
            var lateFee = 50.00m;
            var totalAmountDue = rentAmount + lateFee;

            var emailData = new OverduePaymentEmailData
            {
                TenantFirstName = "Test User",
                TenantEmail = request.RecipientEmail,
                PropertyAddress = "123 Main Street, Apt 4B, Bucharest, Romania",
                RentAmount = rentAmount,
                DueDate = dueDate.ToString("MMMM d, yyyy"),
                DaysOverdue = daysOverdue,
                LateFee = lateFee,
                TotalAmountDue = totalAmountDue,
                PaymentUrl = $"{frontendUrl}/payments",
                OwnerName = "Test Property Owner",
                OwnerEmail = "owner@example.com",
                OwnerPhone = "+40 123 456 789",
                FrontendUrl = frontendUrl
            };

            var subject = $"⚠️ Rent Payment Overdue - {emailData.PropertyAddress}";
            var jobId = _backgroundEmailService.EnqueueOverduePaymentEmail(emailData, subject);

            _logger.LogInformation("Test overdue payment email enqueued (JobId: {JobId}) to {Email}", jobId, request.RecipientEmail);

            return await Task.FromResult(Ok(new
            {
                success = true,
                message = $"Overdue payment test email queued successfully",
                jobId = jobId,
                recipientEmail = request.RecipientEmail
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send test overdue payment email");
            return await Task.FromResult(StatusCode(500, new { success = false, message = "Failed to send test email", error = ex.Message }));
        }
    }

    [HttpPost("lease-expiration")]
    public async Task<IActionResult> SendTestLeaseExpiration([FromBody] TestTemplateEmailRequest request)
    {
        try
        {
            var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:3000";

            // Simulate a lease expiring in 30 days (reminder urgency)
            var leaseEndDate = DateTime.UtcNow.AddDays(30);
            var leaseStartDate = DateTime.UtcNow.AddMonths(-11);
            var daysUntilExpiration = 30;

            var emailData = new LeaseExpirationEmailData
            {
                TenantFirstName = "Test User",
                TenantEmail = request.RecipientEmail,
                PropertyAddress = "123 Main Street, Apt 4B, Bucharest, Romania",
                LeaseEndDate = leaseEndDate.ToString("MMMM d, yyyy"),
                DaysUntilExpiration = daysUntilExpiration,
                LeaseStartDate = leaseStartDate.ToString("MMMM d, yyyy"),
                CurrentRentAmount = 2500.00m,
                RenewalUrl = $"{frontendUrl}/renewal",
                OwnerName = "Test Property Owner",
                OwnerEmail = "owner@example.com",
                OwnerPhone = "+40 123 456 789",
                FrontendUrl = frontendUrl,
                UrgencyLevel = "reminder" // 30 days = reminder
            };

            var subject = $"Lease Expiring in 30 Days - Action Required - {emailData.PropertyAddress}";
            var jobId = _backgroundEmailService.EnqueueLeaseExpirationEmail(emailData, subject);

            _logger.LogInformation("Test lease expiration email enqueued (JobId: {JobId}) to {Email}", jobId, request.RecipientEmail);

            return await Task.FromResult(Ok(new
            {
                success = true,
                message = $"Lease expiration test email queued successfully",
                jobId = jobId,
                recipientEmail = request.RecipientEmail
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send test lease expiration email");
            return await Task.FromResult(StatusCode(500, new { success = false, message = "Failed to send test email", error = ex.Message }));
        }
    }

    [HttpPost("rent-payment-reminder")]
    public async Task<IActionResult> SendTestRentPaymentReminder([FromBody] TestTemplateEmailRequest request)
    {
        try
        {
            var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:3000";

            // Simulate rent due in 3 days
            var dueDate = DateTime.UtcNow.AddDays(3);
            var currentMonth = DateTime.UtcNow;

            var emailData = new RentPaymentReminderEmailData
            {
                TenantFirstName = "Test User",
                TenantEmail = request.RecipientEmail,
                PropertyAddress = "123 Main Street, Apt 4B, Bucharest, Romania",
                RentAmount = 2500.00m,
                DueDate = dueDate.ToString("MMMM d, yyyy"),
                DaysUntilDue = 3,
                PaymentStatus = $"Not yet paid for {currentMonth:MMMM}",
                PaymentUrl = $"{frontendUrl}/payments",
                BankTransferIBAN = "RO49AAAA1B31007593840000",
                BankTransferAccountHolder = "Test Property Owner",
                BankTransferReference = $"RENT-{currentMonth:yyyyMM}-TEST1234",
                OwnerName = "Test Property Owner",
                OwnerEmail = "owner@example.com",
                OwnerPhone = "+40 123 456 789",
                FrontendUrl = frontendUrl,
                OnTimePaymentsThisYear = 11
            };

            var subject = $"Rent Reminder: {emailData.RentAmount:N0} RON due in 3 days ({dueDate:MMMM d})";
            var jobId = _backgroundEmailService.EnqueueRentPaymentReminderEmail(emailData, subject);

            _logger.LogInformation("Test rent payment reminder email enqueued (JobId: {JobId}) to {Email}", jobId, request.RecipientEmail);

            return await Task.FromResult(Ok(new
            {
                success = true,
                message = $"Rent payment reminder test email queued successfully",
                jobId = jobId,
                recipientEmail = request.RecipientEmail
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send test rent payment reminder email");
            return await Task.FromResult(StatusCode(500, new { success = false, message = "Failed to send test email", error = ex.Message }));
        }
    }

    [HttpPost("all")]
    public async Task<IActionResult> SendAllTestEmails([FromBody] TestTemplateEmailRequest request)
    {
        try
        {
            var jobIds = new Dictionary<string, string>();

            // Send all test emails
            var tenantInvitationResult = await SendTestTenantInvitation(request);
            if (tenantInvitationResult is OkObjectResult tenantInvitationOk)
            {
                var result = tenantInvitationOk.Value as dynamic;
                jobIds["tenantInvitation"] = result?.jobId ?? string.Empty;
            }

            var paymentConfirmationResult = await SendTestPaymentConfirmation(request);
            if (paymentConfirmationResult is OkObjectResult paymentConfirmationOk)
            {
                var result = paymentConfirmationOk.Value as dynamic;
                jobIds["paymentConfirmation"] = result?.jobId ?? string.Empty;
            }

            var contractUploadResult = await SendTestContractUpload(request);
            if (contractUploadResult is OkObjectResult contractUploadOk)
            {
                var result = contractUploadOk.Value as dynamic;
                jobIds["contractUpload"] = result?.jobId ?? string.Empty;
            }

            var welcomeResult = await SendTestWelcome(request);
            if (welcomeResult is OkObjectResult welcomeOk)
            {
                var result = welcomeOk.Value as dynamic;
                jobIds["welcome"] = result?.jobId ?? string.Empty;
            }

            var overduePaymentResult = await SendTestOverduePayment(request);
            if (overduePaymentResult is OkObjectResult overduePaymentOk)
            {
                var result = overduePaymentOk.Value as dynamic;
                jobIds["overduePayment"] = result?.jobId ?? string.Empty;
            }

            var leaseExpirationResult = await SendTestLeaseExpiration(request);
            if (leaseExpirationResult is OkObjectResult leaseExpirationOk)
            {
                var result = leaseExpirationOk.Value as dynamic;
                jobIds["leaseExpiration"] = result?.jobId ?? string.Empty;
            }

            var rentPaymentReminderResult = await SendTestRentPaymentReminder(request);
            if (rentPaymentReminderResult is OkObjectResult rentPaymentReminderOk)
            {
                var result = rentPaymentReminderOk.Value as dynamic;
                jobIds["rentPaymentReminder"] = result?.jobId ?? string.Empty;
            }

            _logger.LogInformation("All test emails enqueued to {Email}", request.RecipientEmail);

            return Ok(new
            {
                success = true,
                message = $"All test emails queued successfully to {request.RecipientEmail}",
                jobIds = jobIds,
                recipientEmail = request.RecipientEmail
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send all test emails");
            return StatusCode(500, new { success = false, message = "Failed to send test emails", error = ex.Message });
        }
    }
}

public class TestTemplateEmailRequest
{
    [Required(ErrorMessage = "Recipient email address is required")]
    [EmailAddress(ErrorMessage = "Invalid email address")]
    public string RecipientEmail { get; set; } = string.Empty;
}
