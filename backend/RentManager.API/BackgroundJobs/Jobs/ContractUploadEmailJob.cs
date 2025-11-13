using RentManager.API.Services.Email;
using Hangfire;

namespace RentManager.API.BackgroundJobs.Jobs;

/// <summary>
/// Background job for sending contract upload notification emails
/// </summary>
public class ContractUploadEmailJob : EmailJobBase
{
    public ContractUploadEmailJob(
        IEmailService emailService,
        IEmailTemplateService emailTemplateService,
        ILogger<ContractUploadEmailJob> logger)
        : base(emailService, emailTemplateService, logger)
    {
    }

    /// <summary>
    /// Send contract upload notification in the background
    /// Critical queue for important contract notifications
    /// </summary>
    [AutomaticRetry(Attempts = 5, DelaysInSeconds = new[] { 30, 60, 300, 900, 3600 })]
    [Queue("critical")]
    public async Task SendContractNotificationAsync(
        ContractUploadEmailData emailData,
        string subject,
        IJobCancellationToken cancellationToken)
    {
        await ExecuteEmailJobAsync(
            async () =>
            {
                var (htmlBody, textBody) = await _emailTemplateService
                    .RenderContractUploadEmailAsync(emailData);

                return await _emailService.SendHtmlEmailAsync(
                    to: emailData.TenantEmail,
                    subject: subject,
                    htmlBody: htmlBody,
                    textBody: textBody);
            },
            emailType: "ContractUpload",
            recipient: emailData.TenantEmail,
            cancellationToken: cancellationToken);
    }
}
