# Email Service

This directory contains the email service abstraction and implementations for sending emails through external providers.

## Architecture

The email service follows an abstraction pattern that allows you to easily swap email providers without changing your application code.

- **IEmailService**: The interface that defines all email operations
- **ScalewayEmailService**: Scaleway Transactional Email implementation
- **EmailServiceResponse**: Standard response object for all email operations
- **EmailAttachment**: Model for email attachments

## Configuration

Add the following to your `appsettings.json`:

```json
{
  "ScalewayEmail": {
    "SecretKey": "your-scaleway-secret-key",
    "ProjectId": "your-scaleway-project-id",
    "Region": "fr-par",
    "DefaultFromEmail": "noreply@yourdomain.com",
    "DefaultFromName": "Rent Manager"
  }
}
```

For local development and secrets, use `appsettings.Local.json`.

## Usage Examples

### Basic Usage

```csharp
public class MyController : ControllerBase
{
    private readonly IEmailService _emailService;

    public MyController(IEmailService emailService)
    {
        _emailService = emailService;
    }

    // Send a simple text email
    public async Task SendWelcomeEmail(string userEmail)
    {
        var result = await _emailService.SendTextEmailAsync(
            to: userEmail,
            subject: "Welcome to Rent Manager",
            textBody: "Thank you for signing up!"
        );

        if (!result.Success)
        {
            // Handle error
            _logger.LogError("Failed to send email: {Error}", result.ErrorMessage);
        }
    }

    // Send an HTML email
    public async Task SendRentReminder(string tenantEmail, decimal amount)
    {
        var htmlBody = $@"
            <html>
                <body>
                    <h1>Rent Payment Reminder</h1>
                    <p>Your rent payment of <strong>${amount}</strong> is due soon.</p>
                </body>
            </html>";

        var textBody = $"Your rent payment of ${amount} is due soon.";

        var result = await _emailService.SendHtmlEmailAsync(
            to: tenantEmail,
            subject: "Rent Payment Reminder",
            htmlBody: htmlBody,
            textBody: textBody
        );
    }

    // Send email with attachments
    public async Task SendContractEmail(string tenantEmail, byte[] contractPdf)
    {
        var attachments = new[]
        {
            new EmailAttachment
            {
                FileName = "rental-contract.pdf",
                Content = contractPdf,
                ContentType = "application/pdf"
            }
        };

        var result = await _emailService.SendEmailWithAttachmentsAsync(
            to: tenantEmail,
            subject: "Your Rental Contract",
            htmlBody: "<h1>Please find your rental contract attached</h1>",
            textBody: "Please find your rental contract attached",
            attachments: attachments
        );
    }

    // Send bulk emails
    public async Task SendMonthlyNewsletter(IEnumerable<string> tenantEmails)
    {
        var result = await _emailService.SendBulkEmailAsync(
            to: tenantEmails,
            subject: "Monthly Newsletter",
            htmlBody: "<h1>Newsletter</h1><p>Content here...</p>",
            textBody: "Newsletter content..."
        );
    }
}
```

## Swapping Email Providers

To swap to a different email provider:

1. Create a new class that implements `IEmailService` (e.g., `SendGridEmailService`, `AmazonSESEmailService`)
2. Update the dependency injection in `Program.cs`:

```csharp
// Change from:
builder.Services.AddScoped<IEmailService, ScalewayEmailService>();

// To:
builder.Services.AddScoped<IEmailService, SendGridEmailService>();
```

3. Add the new provider's configuration settings to `appsettings.json`

That's it! Your application code doesn't need to change.

## Scaleway Transactional Email

The Scaleway implementation uses the Scaleway Transactional Email API v1alpha1.

### Features
- Send simple text emails
- Send HTML emails with plain text fallback
- Send bulk emails to multiple recipients
- Send emails with attachments
- Custom sender details
- Comprehensive error handling and logging

### API Regions
- `fr-par` (Paris, France) - Default
- `nl-ams` (Amsterdam, Netherlands)
- `pl-waw` (Warsaw, Poland)

### Rate Limits
Check Scaleway documentation for current rate limits based on your plan.

## Testing

To test the email service locally, configure your Scaleway credentials in `appsettings.Local.json` and inject the service into any controller or service.
