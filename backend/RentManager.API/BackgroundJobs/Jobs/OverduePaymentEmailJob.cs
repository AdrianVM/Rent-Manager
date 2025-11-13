using RentManager.API.Services.Email;
using Hangfire;

namespace RentManager.API.BackgroundJobs.Jobs;

/// <summary>
/// Background job for sending overdue payment alert emails
/// </summary>
public class OverduePaymentEmailJob : EmailJobBase
{
    public OverduePaymentEmailJob(
        IEmailService emailService,
        IEmailTemplateService emailTemplateService,
        ILogger<OverduePaymentEmailJob> logger)
        : base(emailService, emailTemplateService, logger)
    {
    }

    /// <summary>
    /// Send an overdue payment alert email in the background
    /// High priority queue for urgent payment notifications
    /// </summary>
    [AutomaticRetry(Attempts = 5, DelaysInSeconds = new[] { 30, 120, 300, 900, 1800 })]
    [Queue("high-priority")]
    public async Task SendOverduePaymentAlertAsync(
        OverduePaymentEmailData emailData,
        string subject,
        IJobCancellationToken cancellationToken)
    {
        await ExecuteEmailJobAsync(
            async () =>
            {
                var (htmlBody, textBody) = await _emailTemplateService
                    .RenderOverduePaymentEmailAsync(emailData);

                return await _emailService.SendHtmlEmailAsync(
                    to: emailData.TenantEmail,
                    subject: subject,
                    htmlBody: htmlBody,
                    textBody: textBody);
            },
            emailType: "OverduePaymentAlert",
            recipient: emailData.TenantEmail,
            cancellationToken: cancellationToken);
    }
}
