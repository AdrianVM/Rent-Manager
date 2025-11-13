namespace RentManager.API.Services.Email;

/// <summary>
/// Abstraction for enqueueing email jobs in the background
/// Provides a clean interface between controllers/services and Hangfire
/// </summary>
public interface IBackgroundEmailService
{
    /// <summary>
    /// Enqueue a tenant invitation email to be sent in the background
    /// </summary>
    /// <param name="emailData">Email template data</param>
    /// <param name="subject">Email subject</param>
    /// <returns>Hangfire job ID for tracking</returns>
    string EnqueueTenantInvitationEmail(TenantInvitationEmailData emailData, string subject);

    /// <summary>
    /// Enqueue a payment confirmation email to be sent in the background
    /// </summary>
    /// <param name="emailData">Email template data</param>
    /// <param name="subject">Email subject</param>
    /// <returns>Hangfire job ID for tracking</returns>
    string EnqueuePaymentConfirmationEmail(PaymentConfirmationEmailData emailData, string subject);

    /// <summary>
    /// Enqueue a contract upload notification email to be sent in the background
    /// </summary>
    /// <param name="emailData">Email template data</param>
    /// <param name="subject">Email subject</param>
    /// <returns>Hangfire job ID for tracking</returns>
    string EnqueueContractUploadEmail(ContractUploadEmailData emailData, string subject);

    /// <summary>
    /// Enqueue a welcome email to be sent in the background
    /// </summary>
    /// <param name="emailData">Email template data</param>
    /// <param name="subject">Email subject</param>
    /// <returns>Hangfire job ID for tracking</returns>
    string EnqueueWelcomeEmail(WelcomeEmailData emailData, string subject);

    /// <summary>
    /// Enqueue an overdue payment alert email to be sent in the background
    /// </summary>
    /// <param name="emailData">Email template data</param>
    /// <param name="subject">Email subject</param>
    /// <returns>Hangfire job ID for tracking</returns>
    string EnqueueOverduePaymentEmail(OverduePaymentEmailData emailData, string subject);

    /// <summary>
    /// Enqueue a lease expiration warning email to be sent in the background
    /// </summary>
    /// <param name="emailData">Email template data</param>
    /// <param name="subject">Email subject</param>
    /// <returns>Hangfire job ID for tracking</returns>
    string EnqueueLeaseExpirationEmail(LeaseExpirationEmailData emailData, string subject);
}
