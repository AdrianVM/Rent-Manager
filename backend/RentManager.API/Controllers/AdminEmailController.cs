using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentManager.API.DTOs;
using RentManager.API.Services.Email;

namespace RentManager.API.Controllers
{
    [ApiController]
    [Route("api/admin/email")]
    [Authorize] // Require authentication - in production, add role-based authorization
    public class AdminEmailController : ControllerBase
    {
        private readonly IEmailService _emailService;
        private readonly ILogger<AdminEmailController> _logger;

        public AdminEmailController(
            IEmailService emailService,
            ILogger<AdminEmailController> logger)
        {
            _emailService = emailService;
            _logger = logger;
        }

        /// <summary>
        /// Send a single email
        /// </summary>
        [HttpPost("send")]
        public async Task<ActionResult<SendEmailResponse>> SendEmail([FromBody] SendEmailRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var userId = GetCurrentUserId();
                _logger.LogInformation("User {UserId} is sending an email to {To}", userId, request.To);

                EmailServiceResponse result;

                if (request.IsHtml)
                {
                    // Generate plain text fallback from HTML
                    var textBody = StripHtml(request.Body);
                    result = await _emailService.SendHtmlEmailAsync(
                        request.To,
                        request.Subject,
                        request.Body,
                        textBody
                    );
                }
                else
                {
                    result = await _emailService.SendTextEmailAsync(
                        request.To,
                        request.Subject,
                        request.Body
                    );
                }

                if (result.Success)
                {
                    _logger.LogInformation("Email sent successfully. MessageId: {MessageId}", result.MessageId);
                    return Ok(new SendEmailResponse
                    {
                        Success = true,
                        MessageId = result.MessageId,
                        SentAt = result.SentAt
                    });
                }
                else
                {
                    _logger.LogWarning("Email sending failed: {Error}", result.ErrorMessage);
                    return BadRequest(new SendEmailResponse
                    {
                        Success = false,
                        ErrorMessage = result.ErrorMessage
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception while sending email to {To}", request.To);
                return StatusCode(500, new SendEmailResponse
                {
                    Success = false,
                    ErrorMessage = "An error occurred while sending the email"
                });
            }
        }

        /// <summary>
        /// Send bulk emails to multiple recipients
        /// </summary>
        [HttpPost("send-bulk")]
        public async Task<ActionResult<SendEmailResponse>> SendBulkEmail([FromBody] SendBulkEmailRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var userId = GetCurrentUserId();
                _logger.LogInformation("User {UserId} is sending bulk email to {Count} recipients",
                    userId, request.To.Count);

                var textBody = request.IsHtml ? StripHtml(request.Body) : request.Body;

                var result = await _emailService.SendBulkEmailAsync(
                    request.To,
                    request.Subject,
                    request.IsHtml ? request.Body : string.Empty,
                    textBody
                );

                if (result.Success)
                {
                    _logger.LogInformation("Bulk email sent successfully. MessageId: {MessageId}", result.MessageId);
                    return Ok(new SendEmailResponse
                    {
                        Success = true,
                        MessageId = result.MessageId,
                        SentAt = result.SentAt
                    });
                }
                else
                {
                    _logger.LogWarning("Bulk email sending failed: {Error}", result.ErrorMessage);
                    return BadRequest(new SendEmailResponse
                    {
                        Success = false,
                        ErrorMessage = result.ErrorMessage
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception while sending bulk email");
                return StatusCode(500, new SendEmailResponse
                {
                    Success = false,
                    ErrorMessage = "An error occurred while sending the bulk email"
                });
            }
        }

        /// <summary>
        /// Send a test email to verify email configuration
        /// </summary>
        [HttpPost("test")]
        public async Task<ActionResult<SendEmailResponse>> SendTestEmail([FromBody] TestEmailRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var userId = GetCurrentUserId();
                _logger.LogInformation("User {UserId} is sending a test email to {To}", userId, request.TestEmail);

                var htmlBody = @"
                    <html>
                        <body style='font-family: Arial, sans-serif; padding: 20px;'>
                            <h1 style='color: #2563eb;'>Test Email</h1>
                            <p>This is a test email from RentFlow.</p>
                            <p>If you received this email, your email configuration is working correctly!</p>
                            <hr style='margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;' />
                            <p style='color: #6b7280; font-size: 14px;'>
                                Sent at: " + DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss") + @" UTC
                            </p>
                        </body>
                    </html>";

                var textBody = $"Test Email\n\nThis is a test email from RentFlow.\nIf you received this email, your email configuration is working correctly!\n\nSent at: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC";

                var result = await _emailService.SendHtmlEmailAsync(
                    request.TestEmail,
                    "Test Email - RentFlow",
                    htmlBody,
                    textBody
                );

                if (result.Success)
                {
                    _logger.LogInformation("Test email sent successfully. MessageId: {MessageId}", result.MessageId);
                    return Ok(new SendEmailResponse
                    {
                        Success = true,
                        MessageId = result.MessageId,
                        SentAt = result.SentAt
                    });
                }
                else
                {
                    _logger.LogWarning("Test email sending failed: {Error}", result.ErrorMessage);
                    return BadRequest(new SendEmailResponse
                    {
                        Success = false,
                        ErrorMessage = result.ErrorMessage
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception while sending test email");
                return StatusCode(500, new SendEmailResponse
                {
                    Success = false,
                    ErrorMessage = "An error occurred while sending the test email"
                });
            }
        }

        /// <summary>
        /// Get email service information
        /// </summary>
        [HttpGet("info")]
        public ActionResult<object> GetEmailInfo()
        {
            return Ok(new
            {
                Provider = _emailService.ProviderName,
                Status = "Active"
            });
        }

        #region Helper Methods

        private string? GetCurrentUserId()
        {
            return User.FindFirst("sub")?.Value ??
                   User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        }

        /// <summary>
        /// Strip HTML tags to create a plain text version
        /// </summary>
        private string StripHtml(string html)
        {
            if (string.IsNullOrEmpty(html))
                return string.Empty;

            // Simple HTML stripping - replace common tags with appropriate formatting
            var text = html
                .Replace("<br>", "\n")
                .Replace("<br/>", "\n")
                .Replace("<br />", "\n")
                .Replace("</p>", "\n\n")
                .Replace("</div>", "\n")
                .Replace("</h1>", "\n")
                .Replace("</h2>", "\n")
                .Replace("</h3>", "\n")
                .Replace("</h4>", "\n")
                .Replace("</h5>", "\n")
                .Replace("</h6>", "\n");

            // Remove all remaining HTML tags
            text = System.Text.RegularExpressions.Regex.Replace(text, "<[^>]*>", "");

            // Decode HTML entities
            text = System.Net.WebUtility.HtmlDecode(text);

            // Clean up extra whitespace
            text = System.Text.RegularExpressions.Regex.Replace(text, @"\n{3,}", "\n\n");

            return text.Trim();
        }

        #endregion
    }
}
