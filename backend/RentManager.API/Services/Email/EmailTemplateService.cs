using System.Text;
using System.Text.RegularExpressions;

namespace RentManager.API.Services.Email;

public interface IEmailTemplateService
{
    Task<(string htmlBody, string textBody)> RenderTenantInvitationEmailAsync(TenantInvitationEmailData data);
    Task<(string htmlBody, string textBody)> RenderPaymentConfirmationEmailAsync(PaymentConfirmationEmailData data);
    Task<(string htmlBody, string textBody)> RenderWelcomeEmailAsync(WelcomeEmailData data);
    Task<(string htmlBody, string textBody)> RenderContractUploadEmailAsync(ContractUploadEmailData data);
    Task<(string htmlBody, string textBody)> RenderOverduePaymentEmailAsync(OverduePaymentEmailData data);
    Task<(string htmlBody, string textBody)> RenderLeaseExpirationEmailAsync(LeaseExpirationEmailData data);
}

public class TenantInvitationEmailData
{
    public string TenantFirstName { get; set; } = string.Empty;
    public string TenantEmail { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public string OwnerEmail { get; set; } = string.Empty;
    public string? OwnerPhone { get; set; }
    public string PropertyName { get; set; } = string.Empty;
    public string PropertyAddress { get; set; } = string.Empty;
    public string PropertyType { get; set; } = string.Empty;
    public decimal RentAmount { get; set; }
    public string LeaseStartDate { get; set; } = string.Empty;
    public string OnboardingUrl { get; set; } = string.Empty;
    public string ExpirationDate { get; set; } = string.Empty;
    public string FrontendUrl { get; set; } = string.Empty;
}

public class PaymentConfirmationEmailData
{
    public string TenantFirstName { get; set; } = string.Empty;
    public string TenantEmail { get; set; } = string.Empty;
    public string PropertyAddress { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string PaymentDate { get; set; } = string.Empty;
    public string TransactionId { get; set; } = string.Empty;
    public string PaymentReference { get; set; } = string.Empty;
    public string PaymentMethodDisplay { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public string OwnerEmail { get; set; } = string.Empty;
    public string FrontendUrl { get; set; } = string.Empty;
}

public class WelcomeEmailData
{
    public string TenantFirstName { get; set; } = string.Empty;
    public string TenantEmail { get; set; } = string.Empty;
    public string PropertyAddress { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public string OwnerEmail { get; set; } = string.Empty;
    public string? OwnerPhone { get; set; }
    public string FrontendUrl { get; set; } = string.Empty;
}

public class ContractUploadEmailData
{
    public string TenantFirstName { get; set; } = string.Empty;
    public string TenantEmail { get; set; } = string.Empty;
    public string PropertyAddress { get; set; } = string.Empty;
    public string ContractType { get; set; } = string.Empty;
    public string UploadDate { get; set; } = string.Empty;
    public string UploadedBy { get; set; } = string.Empty;
    public string ContractStatus { get; set; } = string.Empty;
    public string ContractViewUrl { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public string OwnerEmail { get; set; } = string.Empty;
    public string? OwnerPhone { get; set; }
    public string FrontendUrl { get; set; } = string.Empty;
}

public class OverduePaymentEmailData
{
    public string TenantFirstName { get; set; } = string.Empty;
    public string TenantEmail { get; set; } = string.Empty;
    public string PropertyAddress { get; set; } = string.Empty;
    public decimal RentAmount { get; set; }
    public string DueDate { get; set; } = string.Empty;
    public int DaysOverdue { get; set; }
    public decimal? LateFee { get; set; }
    public decimal TotalAmountDue { get; set; }
    public string PaymentUrl { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public string OwnerEmail { get; set; } = string.Empty;
    public string? OwnerPhone { get; set; }
    public string FrontendUrl { get; set; } = string.Empty;
}

public class LeaseExpirationEmailData
{
    public string TenantFirstName { get; set; } = string.Empty;
    public string TenantEmail { get; set; } = string.Empty;
    public string PropertyAddress { get; set; } = string.Empty;
    public string LeaseEndDate { get; set; } = string.Empty;
    public int DaysUntilExpiration { get; set; }
    public string LeaseStartDate { get; set; } = string.Empty;
    public decimal CurrentRentAmount { get; set; }
    public string RenewalUrl { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public string OwnerEmail { get; set; } = string.Empty;
    public string? OwnerPhone { get; set; }
    public string FrontendUrl { get; set; } = string.Empty;
    public string UrgencyLevel { get; set; } = string.Empty; // "notice", "reminder", "urgent"
}

public class EmailTemplateService : IEmailTemplateService
{
    private readonly string _templateBasePath;

    public EmailTemplateService(IWebHostEnvironment environment)
    {
        _templateBasePath = Path.Combine(environment.ContentRootPath, "EmailTemplates");
    }

    public async Task<(string htmlBody, string textBody)> RenderTenantInvitationEmailAsync(TenantInvitationEmailData data)
    {
        var htmlTemplatePath = Path.Combine(_templateBasePath, "TenantInvitationEmail.html");
        var textTemplatePath = Path.Combine(_templateBasePath, "TenantInvitationEmail.txt");

        if (!File.Exists(htmlTemplatePath) || !File.Exists(textTemplatePath))
        {
            throw new FileNotFoundException("Email template files not found");
        }

        var htmlTemplate = await File.ReadAllTextAsync(htmlTemplatePath);
        var textTemplate = await File.ReadAllTextAsync(textTemplatePath);

        var htmlBody = RenderTemplate(htmlTemplate, data);
        var textBody = RenderTemplate(textTemplate, data);

        return (htmlBody, textBody);
    }

    private string RenderTemplate(string template, TenantInvitationEmailData data)
    {
        // Replace standard placeholders
        var rendered = template
            .Replace("{{TenantFirstName}}", data.TenantFirstName)
            .Replace("{{TenantEmail}}", data.TenantEmail)
            .Replace("{{OwnerName}}", data.OwnerName)
            .Replace("{{OwnerEmail}}", data.OwnerEmail)
            .Replace("{{PropertyName}}", data.PropertyName)
            .Replace("{{PropertyAddress}}", data.PropertyAddress)
            .Replace("{{PropertyType}}", data.PropertyType)
            .Replace("{{RentAmount}}", FormatCurrency(data.RentAmount))
            .Replace("{{LeaseStartDate}}", data.LeaseStartDate)
            .Replace("{{OnboardingUrl}}", data.OnboardingUrl)
            .Replace("{{ExpirationDate}}", data.ExpirationDate)
            .Replace("{{FrontendUrl}}", data.FrontendUrl);

        // Handle conditional blocks for optional fields (simple implementation)
        // {{#if OwnerPhone}}...{{/if}}
        if (!string.IsNullOrWhiteSpace(data.OwnerPhone))
        {
            rendered = Regex.Replace(rendered, @"\{\{#if OwnerPhone\}\}(.*?)\{\{/if\}\}", "$1", RegexOptions.Singleline);
            rendered = rendered.Replace("{{OwnerPhone}}", data.OwnerPhone);
        }
        else
        {
            rendered = Regex.Replace(rendered, @"\{\{#if OwnerPhone\}\}.*?\{\{/if\}\}", "", RegexOptions.Singleline);
        }

        return rendered;
    }

    public async Task<(string htmlBody, string textBody)> RenderPaymentConfirmationEmailAsync(PaymentConfirmationEmailData data)
    {
        var htmlTemplatePath = Path.Combine(_templateBasePath, "PaymentConfirmationEmail.html");
        var textTemplatePath = Path.Combine(_templateBasePath, "PaymentConfirmationEmail.txt");

        if (!File.Exists(htmlTemplatePath) || !File.Exists(textTemplatePath))
        {
            throw new FileNotFoundException("Payment confirmation email template files not found");
        }

        var htmlTemplate = await File.ReadAllTextAsync(htmlTemplatePath);
        var textTemplate = await File.ReadAllTextAsync(textTemplatePath);

        var htmlBody = RenderPaymentConfirmationTemplate(htmlTemplate, data);
        var textBody = RenderPaymentConfirmationTemplate(textTemplate, data);

        return (htmlBody, textBody);
    }

    private string RenderPaymentConfirmationTemplate(string template, PaymentConfirmationEmailData data)
    {
        var rendered = template
            .Replace("{{TenantFirstName}}", data.TenantFirstName)
            .Replace("{{TenantEmail}}", data.TenantEmail)
            .Replace("{{PropertyAddress}}", data.PropertyAddress)
            .Replace("{{Amount}}", FormatCurrency(data.Amount))
            .Replace("{{PaymentDate}}", data.PaymentDate)
            .Replace("{{TransactionId}}", data.TransactionId)
            .Replace("{{PaymentReference}}", data.PaymentReference)
            .Replace("{{PaymentMethodDisplay}}", data.PaymentMethodDisplay)
            .Replace("{{OwnerName}}", data.OwnerName)
            .Replace("{{OwnerEmail}}", data.OwnerEmail)
            .Replace("{{FrontendUrl}}", data.FrontendUrl);

        return rendered;
    }

    public async Task<(string htmlBody, string textBody)> RenderWelcomeEmailAsync(WelcomeEmailData data)
    {
        var htmlTemplatePath = Path.Combine(_templateBasePath, "WelcomeEmail.html");
        var textTemplatePath = Path.Combine(_templateBasePath, "WelcomeEmail.txt");

        if (!File.Exists(htmlTemplatePath) || !File.Exists(textTemplatePath))
        {
            throw new FileNotFoundException("Welcome email template files not found");
        }

        var htmlTemplate = await File.ReadAllTextAsync(htmlTemplatePath);
        var textTemplate = await File.ReadAllTextAsync(textTemplatePath);

        var htmlBody = RenderWelcomeTemplate(htmlTemplate, data);
        var textBody = RenderWelcomeTemplate(textTemplate, data);

        return (htmlBody, textBody);
    }

    private string RenderWelcomeTemplate(string template, WelcomeEmailData data)
    {
        var rendered = template
            .Replace("{{TenantFirstName}}", data.TenantFirstName)
            .Replace("{{TenantEmail}}", data.TenantEmail)
            .Replace("{{PropertyAddress}}", data.PropertyAddress)
            .Replace("{{OwnerName}}", data.OwnerName)
            .Replace("{{OwnerEmail}}", data.OwnerEmail)
            .Replace("{{FrontendUrl}}", data.FrontendUrl);

        // Handle conditional OwnerPhone
        if (!string.IsNullOrWhiteSpace(data.OwnerPhone))
        {
            rendered = Regex.Replace(rendered, @"\{\{#if OwnerPhone\}\}(.*?)\{\{/if\}\}", "$1", RegexOptions.Singleline);
            rendered = rendered.Replace("{{OwnerPhone}}", data.OwnerPhone);
        }
        else
        {
            rendered = Regex.Replace(rendered, @"\{\{#if OwnerPhone\}\}.*?\{\{/if\}\}", "", RegexOptions.Singleline);
        }

        return rendered;
    }

    public async Task<(string htmlBody, string textBody)> RenderContractUploadEmailAsync(ContractUploadEmailData data)
    {
        var htmlTemplatePath = Path.Combine(_templateBasePath, "ContractUploadEmail.html");
        var textTemplatePath = Path.Combine(_templateBasePath, "ContractUploadEmail.txt");

        if (!File.Exists(htmlTemplatePath) || !File.Exists(textTemplatePath))
        {
            throw new FileNotFoundException("Contract upload email template files not found");
        }

        var htmlTemplate = await File.ReadAllTextAsync(htmlTemplatePath);
        var textTemplate = await File.ReadAllTextAsync(textTemplatePath);

        var htmlBody = RenderContractUploadTemplate(htmlTemplate, data);
        var textBody = RenderContractUploadTemplate(textTemplate, data);

        return (htmlBody, textBody);
    }

    private string RenderContractUploadTemplate(string template, ContractUploadEmailData data)
    {
        var rendered = template
            .Replace("{{TenantFirstName}}", data.TenantFirstName)
            .Replace("{{TenantEmail}}", data.TenantEmail)
            .Replace("{{PropertyAddress}}", data.PropertyAddress)
            .Replace("{{ContractType}}", data.ContractType)
            .Replace("{{UploadDate}}", data.UploadDate)
            .Replace("{{UploadedBy}}", data.UploadedBy)
            .Replace("{{ContractStatus}}", data.ContractStatus)
            .Replace("{{ContractViewUrl}}", data.ContractViewUrl)
            .Replace("{{OwnerName}}", data.OwnerName)
            .Replace("{{OwnerEmail}}", data.OwnerEmail)
            .Replace("{{FrontendUrl}}", data.FrontendUrl);

        // Handle conditional StatusPending
        var isPending = data.ContractStatus.Equals("Pending", StringComparison.OrdinalIgnoreCase);
        if (isPending)
        {
            // Keep the content, remove the conditional tags
            rendered = Regex.Replace(rendered, @"\{\{#if StatusPending\}\}\s*(.*?)\s*\{\{/if\}\}", "$1", RegexOptions.Singleline);
        }
        else
        {
            // Remove the entire conditional block including content
            rendered = Regex.Replace(rendered, @"\{\{#if StatusPending\}\}.*?\{\{/if\}\}", "", RegexOptions.Singleline);
        }

        // Clean up any leftover empty lines
        rendered = Regex.Replace(rendered, @"(\r?\n){3,}", "\n\n", RegexOptions.Multiline);

        // Handle conditional OwnerPhone
        if (!string.IsNullOrWhiteSpace(data.OwnerPhone))
        {
            rendered = Regex.Replace(rendered, @"\{\{#if OwnerPhone\}\}(.*?)\{\{/if\}\}", "$1", RegexOptions.Singleline);
            rendered = rendered.Replace("{{OwnerPhone}}", data.OwnerPhone);
        }
        else
        {
            rendered = Regex.Replace(rendered, @"\{\{#if OwnerPhone\}\}.*?\{\{/if\}\}", "", RegexOptions.Singleline);
        }

        return rendered;
    }

    public async Task<(string htmlBody, string textBody)> RenderOverduePaymentEmailAsync(OverduePaymentEmailData data)
    {
        var htmlTemplatePath = Path.Combine(_templateBasePath, "OverduePaymentEmail.html");
        var textTemplatePath = Path.Combine(_templateBasePath, "OverduePaymentEmail.txt");

        if (!File.Exists(htmlTemplatePath) || !File.Exists(textTemplatePath))
        {
            throw new FileNotFoundException("Overdue payment email template files not found");
        }

        var htmlTemplate = await File.ReadAllTextAsync(htmlTemplatePath);
        var textTemplate = await File.ReadAllTextAsync(textTemplatePath);

        var htmlBody = RenderOverduePaymentTemplate(htmlTemplate, data);
        var textBody = RenderOverduePaymentTemplate(textTemplate, data);

        return (htmlBody, textBody);
    }

    private string RenderOverduePaymentTemplate(string template, OverduePaymentEmailData data)
    {
        var rendered = template
            .Replace("{{TenantFirstName}}", data.TenantFirstName)
            .Replace("{{TenantEmail}}", data.TenantEmail)
            .Replace("{{PropertyAddress}}", data.PropertyAddress)
            .Replace("{{RentAmount}}", FormatCurrency(data.RentAmount))
            .Replace("{{DueDate}}", data.DueDate)
            .Replace("{{DaysOverdue}}", data.DaysOverdue.ToString())
            .Replace("{{TotalAmountDue}}", FormatCurrency(data.TotalAmountDue))
            .Replace("{{PaymentUrl}}", data.PaymentUrl)
            .Replace("{{OwnerName}}", data.OwnerName)
            .Replace("{{OwnerEmail}}", data.OwnerEmail)
            .Replace("{{FrontendUrl}}", data.FrontendUrl);

        // Handle conditional LateFee
        if (data.LateFee.HasValue && data.LateFee.Value > 0)
        {
            rendered = Regex.Replace(rendered, @"\{\{#if LateFee\}\}(.*?)\{\{/if\}\}", "$1", RegexOptions.Singleline);
            rendered = rendered.Replace("{{LateFee}}", FormatCurrency(data.LateFee.Value));
        }
        else
        {
            rendered = Regex.Replace(rendered, @"\{\{#if LateFee\}\}.*?\{\{/if\}\}", "", RegexOptions.Singleline);
        }

        // Handle conditional OwnerPhone
        if (!string.IsNullOrWhiteSpace(data.OwnerPhone))
        {
            rendered = Regex.Replace(rendered, @"\{\{#if OwnerPhone\}\}(.*?)\{\{/if\}\}", "$1", RegexOptions.Singleline);
            rendered = rendered.Replace("{{OwnerPhone}}", data.OwnerPhone);
        }
        else
        {
            rendered = Regex.Replace(rendered, @"\{\{#if OwnerPhone\}\}.*?\{\{/if\}\}", "", RegexOptions.Singleline);
        }

        return rendered;
    }

    public async Task<(string htmlBody, string textBody)> RenderLeaseExpirationEmailAsync(LeaseExpirationEmailData data)
    {
        var htmlTemplatePath = Path.Combine(_templateBasePath, "LeaseExpirationEmail.html");
        var textTemplatePath = Path.Combine(_templateBasePath, "LeaseExpirationEmail.txt");

        if (!File.Exists(htmlTemplatePath) || !File.Exists(textTemplatePath))
        {
            throw new FileNotFoundException("Lease expiration email template files not found");
        }

        var htmlTemplate = await File.ReadAllTextAsync(htmlTemplatePath);
        var textTemplate = await File.ReadAllTextAsync(textTemplatePath);

        var htmlBody = RenderLeaseExpirationTemplate(htmlTemplate, data);
        var textBody = RenderLeaseExpirationTemplate(textTemplate, data);

        return (htmlBody, textBody);
    }

    private string RenderLeaseExpirationTemplate(string template, LeaseExpirationEmailData data)
    {
        var rendered = template
            .Replace("{{TenantFirstName}}", data.TenantFirstName)
            .Replace("{{TenantEmail}}", data.TenantEmail)
            .Replace("{{PropertyAddress}}", data.PropertyAddress)
            .Replace("{{LeaseEndDate}}", data.LeaseEndDate)
            .Replace("{{DaysUntilExpiration}}", data.DaysUntilExpiration.ToString())
            .Replace("{{LeaseStartDate}}", data.LeaseStartDate)
            .Replace("{{CurrentRentAmount}}", FormatCurrency(data.CurrentRentAmount))
            .Replace("{{RenewalUrl}}", data.RenewalUrl)
            .Replace("{{OwnerName}}", data.OwnerName)
            .Replace("{{OwnerEmail}}", data.OwnerEmail)
            .Replace("{{FrontendUrl}}", data.FrontendUrl)
            .Replace("{{UrgencyLevel}}", data.UrgencyLevel);

        // Handle conditional OwnerPhone
        if (!string.IsNullOrWhiteSpace(data.OwnerPhone))
        {
            rendered = Regex.Replace(rendered, @"\{\{#if OwnerPhone\}\}(.*?)\{\{/if\}\}", "$1", RegexOptions.Singleline);
            rendered = rendered.Replace("{{OwnerPhone}}", data.OwnerPhone);
        }
        else
        {
            rendered = Regex.Replace(rendered, @"\{\{#if OwnerPhone\}\}.*?\{\{/if\}\}", "", RegexOptions.Singleline);
        }

        return rendered;
    }

    private string FormatCurrency(decimal amount)
    {
        // Format with Romanian locale (uses period as thousands separator)
        return amount.ToString("N0", new System.Globalization.CultureInfo("ro-RO"));
    }
}
