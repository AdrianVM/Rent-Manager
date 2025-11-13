using RentManager.API.Services.Email;
using Hangfire;

namespace RentManager.API.BackgroundJobs.Jobs;

/// <summary>
/// Background job for sending rent payment reminder emails
/// </summary>
public class RentPaymentReminderEmailJob : EmailJobBase
{
    public RentPaymentReminderEmailJob(
        IEmailService emailService,
        IEmailTemplateService emailTemplateService,
        ILogger<RentPaymentReminderEmailJob> logger)
        : base(emailService, emailTemplateService, logger)
    {
    }

    /// <summary>
    /// Send a rent payment reminder email in the background
    /// Default priority queue
    /// </summary>
    [AutomaticRetry(Attempts = 5, DelaysInSeconds = new[] { 30, 120, 300, 900, 1800 })]
    [Queue("default")]
    public async Task SendRentPaymentReminderAsync(
        RentPaymentReminderEmailData emailData,
        string subject,
        IJobCancellationToken cancellationToken)
    {
        await ExecuteEmailJobAsync(
            async () =>
            {
                var (htmlBody, textBody) = await _emailTemplateService
                    .RenderRentPaymentReminderEmailAsync(emailData);

                return await _emailService.SendHtmlEmailAsync(
                    to: emailData.TenantEmail,
                    subject: subject,
                    htmlBody: htmlBody,
                    textBody: textBody);
            },
            emailType: "RentPaymentReminder",
            recipient: emailData.TenantEmail,
            cancellationToken: cancellationToken);
    }
}
