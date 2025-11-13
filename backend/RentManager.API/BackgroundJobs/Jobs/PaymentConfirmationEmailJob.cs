using RentManager.API.Services.Email;
using Hangfire;

namespace RentManager.API.BackgroundJobs.Jobs;

/// <summary>
/// Background job for sending payment confirmation emails
/// </summary>
public class PaymentConfirmationEmailJob : EmailJobBase
{
    public PaymentConfirmationEmailJob(
        IEmailService emailService,
        IEmailTemplateService emailTemplateService,
        ILogger<PaymentConfirmationEmailJob> logger)
        : base(emailService, emailTemplateService, logger)
    {
    }

    /// <summary>
    /// Send a payment confirmation email in the background
    /// Default priority queue
    /// </summary>
    [AutomaticRetry(Attempts = 5, DelaysInSeconds = new[] { 30, 120, 300, 900, 1800 })]
    [Queue("default")]
    public async Task SendPaymentConfirmationAsync(
        PaymentConfirmationEmailData emailData,
        string subject,
        IJobCancellationToken cancellationToken)
    {
        await ExecuteEmailJobAsync(
            async () =>
            {
                var (htmlBody, textBody) = await _emailTemplateService
                    .RenderPaymentConfirmationEmailAsync(emailData);

                return await _emailService.SendHtmlEmailAsync(
                    to: emailData.TenantEmail,
                    subject: subject,
                    htmlBody: htmlBody,
                    textBody: textBody);
            },
            emailType: "PaymentConfirmation",
            recipient: emailData.TenantEmail,
            cancellationToken: cancellationToken);
    }
}
