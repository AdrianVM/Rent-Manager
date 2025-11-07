using Microsoft.Extensions.Options;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace RentManager.API.Services.Email;

/// <summary>
/// Scaleway Transactional Email service implementation
/// </summary>
public class ScalewayEmailService : IEmailService
{
    private readonly ScalewayEmailSettings _settings;
    private readonly ILogger<ScalewayEmailService> _logger;
    private readonly HttpClient _httpClient;

    public string ProviderName => "Scaleway";

    public ScalewayEmailService(
        IOptions<ScalewayEmailSettings> settings,
        ILogger<ScalewayEmailService> logger,
        IHttpClientFactory httpClientFactory)
    {
        _settings = settings.Value;
        _logger = logger;
        _httpClient = httpClientFactory.CreateClient();

        // Configure HTTP client for Scaleway API
        _httpClient.BaseAddress = new Uri($"https://api.scaleway.com/transactional-email/v1alpha1/regions/{_settings.Region}/");
        _httpClient.DefaultRequestHeaders.Add("X-Auth-Token", _settings.SecretKey);
        _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    }

    public async Task<EmailServiceResponse> SendTextEmailAsync(string to, string subject, string textBody)
    {
        return await SendEmailAsync(
            _settings.DefaultFromEmail,
            _settings.DefaultFromName,
            to,
            subject,
            string.Empty,
            textBody);
    }

    public async Task<EmailServiceResponse> SendHtmlEmailAsync(string to, string subject, string htmlBody, string? textBody = null)
    {
        return await SendEmailAsync(
            _settings.DefaultFromEmail,
            _settings.DefaultFromName,
            to,
            subject,
            htmlBody,
            textBody);
    }

    public async Task<EmailServiceResponse> SendEmailAsync(
        string from,
        string fromName,
        string to,
        string subject,
        string htmlBody,
        string? textBody = null)
    {
        try
        {
            var emailRequest = new ScalewayEmailRequest
            {
                From = new EmailAddress { Email = from, Name = fromName },
                To = new[] { new EmailAddress { Email = to } },
                Subject = subject,
                Html = htmlBody,
                Text = textBody ?? string.Empty,
                ProjectId = _settings.ProjectId
            };

            var jsonContent = JsonSerializer.Serialize(emailRequest, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
                DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
            });

            var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync("emails", content);

            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                var emailResponse = JsonSerializer.Deserialize<ScalewayEmailResponse>(responseContent, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
                });

                _logger.LogInformation("Scaleway email sent successfully. MessageId: {MessageId}, To: {To}",
                    emailResponse?.Id, to);

                return new EmailServiceResponse
                {
                    Success = true,
                    MessageId = emailResponse?.Id,
                    SentAt = DateTimeOffset.UtcNow,
                    Metadata = new Dictionary<string, object>
                    {
                        { "scaleway_email_id", emailResponse?.Id ?? "" },
                        { "scaleway_status", emailResponse?.Status ?? "" }
                    }
                };
            }
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("Scaleway email send failed. StatusCode: {StatusCode}, Response: {Response}, RequestUrl: {RequestUrl}",
                    response.StatusCode, errorContent, _httpClient.BaseAddress + "emails");

                return new EmailServiceResponse
                {
                    Success = false,
                    ErrorMessage = $"Scaleway API Error ({response.StatusCode}): {errorContent}",
                    ErrorCode = response.StatusCode.ToString()
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Scaleway email send exception. To: {To}", to);

            return new EmailServiceResponse
            {
                Success = false,
                ErrorMessage = ex.Message,
                ErrorCode = "EXCEPTION"
            };
        }
    }

    public async Task<EmailServiceResponse> SendBulkEmailAsync(
        IEnumerable<string> to,
        string subject,
        string htmlBody,
        string? textBody = null)
    {
        try
        {
            var toAddresses = to.Select(email => new EmailAddress { Email = email }).ToArray();

            var emailRequest = new ScalewayEmailRequest
            {
                From = new EmailAddress { Email = _settings.DefaultFromEmail, Name = _settings.DefaultFromName },
                To = toAddresses,
                Subject = subject,
                Html = htmlBody,
                Text = textBody ?? string.Empty,
                ProjectId = _settings.ProjectId
            };

            var jsonContent = JsonSerializer.Serialize(emailRequest, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
                DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
            });

            var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync("emails", content);

            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                var emailResponse = JsonSerializer.Deserialize<ScalewayEmailResponse>(responseContent, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
                });

                _logger.LogInformation("Scaleway bulk email sent successfully. MessageId: {MessageId}, Recipients: {Count}",
                    emailResponse?.Id, toAddresses.Length);

                return new EmailServiceResponse
                {
                    Success = true,
                    MessageId = emailResponse?.Id,
                    SentAt = DateTimeOffset.UtcNow,
                    Metadata = new Dictionary<string, object>
                    {
                        { "scaleway_email_id", emailResponse?.Id ?? "" },
                        { "recipients_count", toAddresses.Length }
                    }
                };
            }
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("Scaleway bulk email send failed. StatusCode: {StatusCode}, Error: {Error}",
                    response.StatusCode, errorContent);

                return new EmailServiceResponse
                {
                    Success = false,
                    ErrorMessage = $"Failed to send bulk email: {response.StatusCode}",
                    ErrorCode = response.StatusCode.ToString()
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Scaleway bulk email send exception");

            return new EmailServiceResponse
            {
                Success = false,
                ErrorMessage = ex.Message,
                ErrorCode = "EXCEPTION"
            };
        }
    }

    public async Task<EmailServiceResponse> SendEmailWithAttachmentsAsync(
        string to,
        string subject,
        string htmlBody,
        string? textBody,
        IEnumerable<EmailAttachment> attachments)
    {
        try
        {
            var scalewayAttachments = attachments.Select(a => new ScalewayAttachment
            {
                Name = a.FileName,
                Content = Convert.ToBase64String(a.Content),
                Type = a.ContentType
            }).ToArray();

            var emailRequest = new ScalewayEmailRequest
            {
                From = new EmailAddress { Email = _settings.DefaultFromEmail, Name = _settings.DefaultFromName },
                To = new[] { new EmailAddress { Email = to } },
                Subject = subject,
                Html = htmlBody,
                Text = textBody ?? string.Empty,
                ProjectId = _settings.ProjectId,
                Attachments = scalewayAttachments
            };

            var jsonContent = JsonSerializer.Serialize(emailRequest, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
                DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
            });

            var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync("emails", content);

            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                var emailResponse = JsonSerializer.Deserialize<ScalewayEmailResponse>(responseContent, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
                });

                _logger.LogInformation("Scaleway email with attachments sent successfully. MessageId: {MessageId}, To: {To}, Attachments: {Count}",
                    emailResponse?.Id, to, scalewayAttachments.Length);

                return new EmailServiceResponse
                {
                    Success = true,
                    MessageId = emailResponse?.Id,
                    SentAt = DateTimeOffset.UtcNow,
                    Metadata = new Dictionary<string, object>
                    {
                        { "scaleway_email_id", emailResponse?.Id ?? "" },
                        { "attachments_count", scalewayAttachments.Length }
                    }
                };
            }
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("Scaleway email with attachments send failed. StatusCode: {StatusCode}, Error: {Error}",
                    response.StatusCode, errorContent);

                return new EmailServiceResponse
                {
                    Success = false,
                    ErrorMessage = $"Failed to send email with attachments: {response.StatusCode}",
                    ErrorCode = response.StatusCode.ToString()
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Scaleway email with attachments send exception. To: {To}", to);

            return new EmailServiceResponse
            {
                Success = false,
                ErrorMessage = ex.Message,
                ErrorCode = "EXCEPTION"
            };
        }
    }

    #region Scaleway API Models

    private class ScalewayEmailRequest
    {
        [JsonPropertyName("from")]
        public EmailAddress From { get; set; } = null!;

        [JsonPropertyName("to")]
        public EmailAddress[] To { get; set; } = null!;

        [JsonPropertyName("subject")]
        public string Subject { get; set; } = string.Empty;

        [JsonPropertyName("text")]
        public string Text { get; set; } = string.Empty;

        [JsonPropertyName("html")]
        public string Html { get; set; } = string.Empty;

        [JsonPropertyName("project_id")]
        public string ProjectId { get; set; } = string.Empty;

        [JsonPropertyName("attachments")]
        public ScalewayAttachment[]? Attachments { get; set; }
    }

    private class EmailAddress
    {
        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        public string? Name { get; set; }
    }

    private class ScalewayAttachment
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("type")]
        public string Type { get; set; } = string.Empty;

        [JsonPropertyName("content")]
        public string Content { get; set; } = string.Empty; // Base64 encoded
    }

    private class ScalewayEmailResponse
    {
        [JsonPropertyName("id")]
        public string? Id { get; set; }

        [JsonPropertyName("status")]
        public string? Status { get; set; }

        [JsonPropertyName("created_at")]
        public DateTime? CreatedAt { get; set; }
    }

    #endregion
}

/// <summary>
/// Scaleway email configuration settings
/// </summary>
public class ScalewayEmailSettings
{
    public string SecretKey { get; set; } = string.Empty;
    public string ProjectId { get; set; } = string.Empty;
    public string Region { get; set; } = "fr-par"; // Default to Paris region
    public string DefaultFromEmail { get; set; } = string.Empty;
    public string DefaultFromName { get; set; } = string.Empty;
}
