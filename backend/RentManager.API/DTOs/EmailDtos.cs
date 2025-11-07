using System.ComponentModel.DataAnnotations;

namespace RentManager.API.DTOs
{
    /// <summary>
    /// Request to send an email
    /// </summary>
    public class SendEmailRequest
    {
        [Required(ErrorMessage = "Recipient email is required")]
        [EmailAddress(ErrorMessage = "Invalid email address")]
        public string To { get; set; } = string.Empty;

        [Required(ErrorMessage = "Subject is required")]
        [MaxLength(200, ErrorMessage = "Subject cannot exceed 200 characters")]
        public string Subject { get; set; } = string.Empty;

        [Required(ErrorMessage = "Message body is required")]
        public string Body { get; set; } = string.Empty;

        public bool IsHtml { get; set; } = true;
    }

    /// <summary>
    /// Response after sending an email
    /// </summary>
    public class SendEmailResponse
    {
        public bool Success { get; set; }
        public string? MessageId { get; set; }
        public string? ErrorMessage { get; set; }
        public DateTimeOffset? SentAt { get; set; }
    }

    /// <summary>
    /// Request to send bulk emails
    /// </summary>
    public class SendBulkEmailRequest
    {
        [Required(ErrorMessage = "At least one recipient is required")]
        [MinLength(1, ErrorMessage = "At least one recipient is required")]
        public List<string> To { get; set; } = new List<string>();

        [Required(ErrorMessage = "Subject is required")]
        [MaxLength(200, ErrorMessage = "Subject cannot exceed 200 characters")]
        public string Subject { get; set; } = string.Empty;

        [Required(ErrorMessage = "Message body is required")]
        public string Body { get; set; } = string.Empty;

        public bool IsHtml { get; set; } = true;
    }

    /// <summary>
    /// Request to test email configuration
    /// </summary>
    public class TestEmailRequest
    {
        [Required(ErrorMessage = "Test email address is required")]
        [EmailAddress(ErrorMessage = "Invalid email address")]
        public string TestEmail { get; set; } = string.Empty;
    }
}
