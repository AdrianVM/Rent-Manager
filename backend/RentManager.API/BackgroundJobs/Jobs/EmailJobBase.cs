using RentManager.API.Services.Email;
using Hangfire;
using Hangfire.Storage;

namespace RentManager.API.BackgroundJobs.Jobs;

/// <summary>
/// Base class for all email background jobs providing common retry logic and error handling
/// </summary>
public abstract class EmailJobBase
{
    protected readonly IEmailService _emailService;
    protected readonly IEmailTemplateService _emailTemplateService;
    protected readonly ILogger _logger;

    protected EmailJobBase(
        IEmailService emailService,
        IEmailTemplateService emailTemplateService,
        ILogger logger)
    {
        _emailService = emailService;
        _emailTemplateService = emailTemplateService;
        _logger = logger;
    }

    /// <summary>
    /// Template method for executing email jobs with consistent error handling
    /// </summary>
    protected async Task<bool> ExecuteEmailJobAsync(
        Func<Task<EmailServiceResponse>> emailOperation,
        string emailType,
        string recipient,
        IJobCancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        _logger.LogInformation(
            "Executing {EmailType} email job for {Recipient}",
            emailType, recipient);

        try
        {
            var response = await emailOperation();

            if (response.Success)
            {
                _logger.LogInformation(
                    "{EmailType} email sent successfully to {Recipient}. MessageId: {MessageId}",
                    emailType, recipient, response.MessageId);
                return true;
            }
            else
            {
                _logger.LogError(
                    "{EmailType} email failed for {Recipient}. Error: {Error} (Code: {Code})",
                    emailType, recipient, response.ErrorMessage, response.ErrorCode);

                // Determine if we should retry based on error type
                if (IsRetryableError(response))
                {
                    throw new EmailDeliveryException(
                        $"Retryable email failure: {response.ErrorMessage}",
                        response.ErrorCode);
                }

                // Non-retryable error - log and don't retry
                _logger.LogWarning(
                    "Non-retryable error for {EmailType} to {Recipient}. Will not retry.",
                    emailType, recipient);
                return false;
            }
        }
        catch (EmailDeliveryException)
        {
            // Re-throw to trigger Hangfire retry
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Unexpected error sending {EmailType} email to {Recipient}",
                emailType, recipient);

            // Treat unexpected errors as retryable
            throw new EmailDeliveryException(
                $"Unexpected email delivery error: {ex.Message}",
                innerException: ex);
        }
    }

    /// <summary>
    /// Determine if an email error should trigger a retry
    /// </summary>
    private bool IsRetryableError(EmailServiceResponse response)
    {
        // Retry on:
        // - Network/timeout errors
        // - Rate limiting (429)
        // - Server errors (5xx)
        // - Temporary Scaleway API issues

        var retryableErrorCodes = new[]
        {
            "RATE_LIMIT_EXCEEDED",
            "TIMEOUT",
            "NETWORK_ERROR",
            "SERVICE_UNAVAILABLE",
            "INTERNAL_SERVER_ERROR"
        };

        return response.ErrorCode != null &&
               retryableErrorCodes.Any(code =>
                   response.ErrorCode.Contains(code, StringComparison.OrdinalIgnoreCase));
    }
}

/// <summary>
/// Custom exception for email delivery failures that should trigger retries
/// </summary>
public class EmailDeliveryException : Exception
{
    public string? ErrorCode { get; }

    public EmailDeliveryException(string message, string? errorCode = null, Exception? innerException = null)
        : base(message, innerException)
    {
        ErrorCode = errorCode;
    }
}
