using RentManager.API.Services.Email;
using Hangfire;

namespace RentManager.API.BackgroundJobs.Jobs;

/// <summary>
/// Background job for sending welcome emails to new tenants
/// </summary>
public class WelcomeEmailJob : EmailJobBase
{
    public WelcomeEmailJob(
        IEmailService emailService,
        IEmailTemplateService emailTemplateService,
        ILogger<WelcomeEmailJob> logger)
        : base(emailService, emailTemplateService, logger)
    {
    }

    /// <summary>
    /// Send welcome email in the background
    /// Lower priority - uses default queue
    /// </summary>
    [AutomaticRetry(Attempts = 5, DelaysInSeconds = new[] { 60, 180, 600, 1800, 3600 })]
    [Queue("default")]
    public async Task SendWelcomeEmailAsync(
        WelcomeEmailData emailData,
        string subject,
        IJobCancellationToken cancellationToken)
    {
        await ExecuteEmailJobAsync(
            async () =>
            {
                var (htmlBody, textBody) = await _emailTemplateService
                    .RenderWelcomeEmailAsync(emailData);

                return await _emailService.SendHtmlEmailAsync(
                    to: emailData.TenantEmail,
                    subject: subject,
                    htmlBody: htmlBody,
                    textBody: textBody);
            },
            emailType: "Welcome",
            recipient: emailData.TenantEmail,
            cancellationToken: cancellationToken);
    }
}
