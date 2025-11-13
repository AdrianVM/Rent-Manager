using RentManager.API.Services.Email;
using Hangfire;

namespace RentManager.API.BackgroundJobs.Jobs;

/// <summary>
/// Background job for sending lease expiration warning emails
/// </summary>
public class LeaseExpirationEmailJob : EmailJobBase
{
    public LeaseExpirationEmailJob(
        IEmailService emailService,
        IEmailTemplateService emailTemplateService,
        ILogger<LeaseExpirationEmailJob> logger)
        : base(emailService, emailTemplateService, logger)
    {
    }

    /// <summary>
    /// Send a lease expiration warning email in the background
    /// Default priority queue
    /// </summary>
    [AutomaticRetry(Attempts = 5, DelaysInSeconds = new[] { 30, 120, 300, 900, 1800 })]
    [Queue("default")]
    public async Task SendLeaseExpirationWarningAsync(
        LeaseExpirationEmailData emailData,
        string subject,
        IJobCancellationToken cancellationToken)
    {
        await ExecuteEmailJobAsync(
            async () =>
            {
                var (htmlBody, textBody) = await _emailTemplateService
                    .RenderLeaseExpirationEmailAsync(emailData);

                return await _emailService.SendHtmlEmailAsync(
                    to: emailData.TenantEmail,
                    subject: subject,
                    htmlBody: htmlBody,
                    textBody: textBody);
            },
            emailType: "LeaseExpirationWarning",
            recipient: emailData.TenantEmail,
            cancellationToken: cancellationToken);
    }
}
