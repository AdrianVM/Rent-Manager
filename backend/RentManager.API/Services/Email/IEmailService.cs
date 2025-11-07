namespace RentManager.API.Services.Email;

/// <summary>
/// Email service abstraction for sending emails through external providers
/// </summary>
public interface IEmailService
{
    /// <summary>
    /// Get the name of the email service provider
    /// </summary>
    string ProviderName { get; }

    /// <summary>
    /// Send a simple text email
    /// </summary>
    /// <param name="to">Recipient email address</param>
    /// <param name="subject">Email subject</param>
    /// <param name="textBody">Plain text body</param>
    /// <returns>Email service response</returns>
    Task<EmailServiceResponse> SendTextEmailAsync(string to, string subject, string textBody);

    /// <summary>
    /// Send an HTML email
    /// </summary>
    /// <param name="to">Recipient email address</param>
    /// <param name="subject">Email subject</param>
    /// <param name="htmlBody">HTML body</param>
    /// <param name="textBody">Plain text body (fallback)</param>
    /// <returns>Email service response</returns>
    Task<EmailServiceResponse> SendHtmlEmailAsync(string to, string subject, string htmlBody, string? textBody = null);

    /// <summary>
    /// Send an email with custom sender details
    /// </summary>
    /// <param name="from">Sender email address</param>
    /// <param name="fromName">Sender name</param>
    /// <param name="to">Recipient email address</param>
    /// <param name="subject">Email subject</param>
    /// <param name="htmlBody">HTML body</param>
    /// <param name="textBody">Plain text body (fallback)</param>
    /// <returns>Email service response</returns>
    Task<EmailServiceResponse> SendEmailAsync(string from, string fromName, string to, string subject, string htmlBody, string? textBody = null);

    /// <summary>
    /// Send an email to multiple recipients
    /// </summary>
    /// <param name="to">List of recipient email addresses</param>
    /// <param name="subject">Email subject</param>
    /// <param name="htmlBody">HTML body</param>
    /// <param name="textBody">Plain text body (fallback)</param>
    /// <returns>Email service response</returns>
    Task<EmailServiceResponse> SendBulkEmailAsync(IEnumerable<string> to, string subject, string htmlBody, string? textBody = null);

    /// <summary>
    /// Send an email with attachments
    /// </summary>
    /// <param name="to">Recipient email address</param>
    /// <param name="subject">Email subject</param>
    /// <param name="htmlBody">HTML body</param>
    /// <param name="textBody">Plain text body (fallback)</param>
    /// <param name="attachments">List of email attachments</param>
    /// <returns>Email service response</returns>
    Task<EmailServiceResponse> SendEmailWithAttachmentsAsync(
        string to,
        string subject,
        string htmlBody,
        string? textBody,
        IEnumerable<EmailAttachment> attachments);
}

/// <summary>
/// Response from an email service operation
/// </summary>
public class EmailServiceResponse
{
    public bool Success { get; set; }
    public string? MessageId { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
    public DateTimeOffset? SentAt { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
}

/// <summary>
/// Email attachment
/// </summary>
public class EmailAttachment
{
    public required string FileName { get; set; }
    public required byte[] Content { get; set; }
    public required string ContentType { get; set; }
}
