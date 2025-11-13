using Hangfire;
using RentManager.API.BackgroundJobs.Jobs;

namespace RentManager.API.Services.Email;

/// <summary>
/// Implementation of background email service using Hangfire
/// </summary>
public class BackgroundEmailService : IBackgroundEmailService
{
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly ILogger<BackgroundEmailService> _logger;

    public BackgroundEmailService(
        IBackgroundJobClient backgroundJobClient,
        ILogger<BackgroundEmailService> logger)
    {
        _backgroundJobClient = backgroundJobClient;
        _logger = logger;
    }

    public string EnqueueTenantInvitationEmail(TenantInvitationEmailData emailData, string subject)
    {
        _logger.LogInformation(
            "Enqueueing tenant invitation email for {Email}",
            emailData.TenantEmail);

        var jobId = _backgroundJobClient.Enqueue<TenantInvitationEmailJob>(
            job => job.SendInvitationEmailAsync(emailData, subject, JobCancellationToken.Null));

        _logger.LogInformation(
            "Tenant invitation email enqueued with JobId: {JobId}",
            jobId);

        return jobId;
    }

    public string EnqueuePaymentConfirmationEmail(PaymentConfirmationEmailData emailData, string subject)
    {
        _logger.LogInformation(
            "Enqueueing payment confirmation email for {Email}",
            emailData.TenantEmail);

        var jobId = _backgroundJobClient.Enqueue<PaymentConfirmationEmailJob>(
            job => job.SendPaymentConfirmationAsync(emailData, subject, JobCancellationToken.Null));

        _logger.LogInformation(
            "Payment confirmation email enqueued with JobId: {JobId}",
            jobId);

        return jobId;
    }

    public string EnqueueContractUploadEmail(ContractUploadEmailData emailData, string subject)
    {
        _logger.LogInformation(
            "Enqueueing contract upload notification for {Email}",
            emailData.TenantEmail);

        var jobId = _backgroundJobClient.Enqueue<ContractUploadEmailJob>(
            job => job.SendContractNotificationAsync(emailData, subject, JobCancellationToken.Null));

        _logger.LogInformation(
            "Contract upload email enqueued with JobId: {JobId}",
            jobId);

        return jobId;
    }

    public string EnqueueWelcomeEmail(WelcomeEmailData emailData, string subject)
    {
        _logger.LogInformation(
            "Enqueueing welcome email for {Email}",
            emailData.TenantEmail);

        var jobId = _backgroundJobClient.Enqueue<WelcomeEmailJob>(
            job => job.SendWelcomeEmailAsync(emailData, subject, JobCancellationToken.Null));

        _logger.LogInformation(
            "Welcome email enqueued with JobId: {JobId}",
            jobId);

        return jobId;
    }

    public string EnqueueOverduePaymentEmail(OverduePaymentEmailData emailData, string subject)
    {
        _logger.LogInformation(
            "Enqueueing overdue payment alert for {Email} - {DaysOverdue} days overdue",
            emailData.TenantEmail,
            emailData.DaysOverdue);

        var jobId = _backgroundJobClient.Enqueue<OverduePaymentEmailJob>(
            job => job.SendOverduePaymentAlertAsync(emailData, subject, JobCancellationToken.Null));

        _logger.LogInformation(
            "Overdue payment email enqueued with JobId: {JobId}",
            jobId);

        return jobId;
    }

    public string EnqueueLeaseExpirationEmail(LeaseExpirationEmailData emailData, string subject)
    {
        _logger.LogInformation(
            "Enqueueing lease expiration warning for {Email} - {DaysUntilExpiration} days until expiration",
            emailData.TenantEmail,
            emailData.DaysUntilExpiration);

        var jobId = _backgroundJobClient.Enqueue<LeaseExpirationEmailJob>(
            job => job.SendLeaseExpirationWarningAsync(emailData, subject, JobCancellationToken.Null));

        _logger.LogInformation(
            "Lease expiration email enqueued with JobId: {JobId}",
            jobId);

        return jobId;
    }
}
