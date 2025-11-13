using RentManager.API.Services.Email;
using Hangfire;

namespace RentManager.API.BackgroundJobs.Jobs;

/// <summary>
/// Background job for sending tenant invitation emails
/// </summary>
public class TenantInvitationEmailJob : EmailJobBase
{
    public TenantInvitationEmailJob(
        IEmailService emailService,
        IEmailTemplateService emailTemplateService,
        ILogger<TenantInvitationEmailJob> logger)
        : base(emailService, emailTemplateService, logger)
    {
    }

    /// <summary>
    /// Send a tenant invitation email in the background
    /// Hangfire will automatically retry on failure (up to 5 times with exponential backoff)
    /// </summary>
    [AutomaticRetry(Attempts = 5, DelaysInSeconds = new[] { 30, 60, 300, 900, 3600 })]
    [Queue("critical")] // High priority for invitation emails
    public async Task SendInvitationEmailAsync(
        TenantInvitationEmailData emailData,
        string subject,
        IJobCancellationToken cancellationToken)
    {
        await ExecuteEmailJobAsync(
            async () =>
            {
                // Render email templates
                var (htmlBody, textBody) = await _emailTemplateService
                    .RenderTenantInvitationEmailAsync(emailData);

                // Send email
                return await _emailService.SendHtmlEmailAsync(
                    to: emailData.TenantEmail,
                    subject: subject,
                    htmlBody: htmlBody,
                    textBody: textBody);
            },
            emailType: "TenantInvitation",
            recipient: emailData.TenantEmail,
            cancellationToken: cancellationToken);
    }
}
