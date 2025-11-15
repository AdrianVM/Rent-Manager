using RentManager.API.Models;
using RentManager.API.Services.DataSubject;
using RentManager.API.Services.Email;

namespace RentManager.API.BackgroundJobs.Jobs;

/// <summary>
/// Background job for generating data access exports
/// Processes GDPR Article 15 data access requests
/// </summary>
public class DataAccessRequestJob
{
    private readonly ILogger<DataAccessRequestJob> _logger;
    private readonly IServiceScopeFactory _serviceScopeFactory;

    public DataAccessRequestJob(
        ILogger<DataAccessRequestJob> logger,
        IServiceScopeFactory serviceScopeFactory)
    {
        _logger = logger;
        _serviceScopeFactory = serviceScopeFactory;
    }

    /// <summary>
    /// Generates data export for a data access request
    /// </summary>
    public async Task ExecuteAsync(int requestId)
    {
        _logger.LogInformation("Starting data access export generation for request {RequestId}", requestId);

        using var scope = _serviceScopeFactory.CreateScope();
        var requestService = scope.ServiceProvider.GetRequiredService<IDataSubjectRequestService>();
        var dataAccessService = scope.ServiceProvider.GetRequiredService<IDataAccessService>();
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailTemplateService>();

        try
        {
            // Get the request
            var request = await requestService.GetRequestByIdAsync(requestId);
            if (request == null)
            {
                _logger.LogWarning("Request {RequestId} not found", requestId);
                return;
            }

            // Generate the export
            var exportJson = await dataAccessService.GenerateDataExportAsync(request.UserId);

            // Save the export to a temporary location
            var exportFileName = $"data-export-{request.UserId}-{DateTimeOffset.UtcNow:yyyyMMddHHmmss}.json";
            var exportPath = Path.Combine(Path.GetTempPath(), "rent-manager-exports", exportFileName);
            var exportDir = Path.GetDirectoryName(exportPath);

            if (!string.IsNullOrEmpty(exportDir) && !Directory.Exists(exportDir))
            {
                Directory.CreateDirectory(exportDir);
            }

            await File.WriteAllTextAsync(exportPath, exportJson);

            // Update the request with the export file path
            request.ExportFilePath = exportPath;
            request.ExportExpiresAt = DateTimeOffset.UtcNow.AddDays(7); // Link expires in 7 days

            await requestService.UpdateRequestStatusAsync(
                requestId,
                DataSubjectRequestStatus.Completed,
                "Data export generated successfully. Download link will expire in 7 days.",
                "System",
                "System"
            );

            await requestService.RecordHistoryAsync(
                requestId,
                "ExportGenerated",
                $"Data export generated: {exportFileName} ({exportJson.Length} bytes)",
                "System",
                "System",
                null
            );

            // TODO: Send email notification when email templates are created
            // For now, just log the completion
            // In Phase 9 (email templates), we'll add proper email notifications

            _logger.LogInformation(
                "Data export generated for request {RequestId}. File: {FileName}, Size: {Size} bytes",
                requestId,
                exportFileName,
                exportJson.Length
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate data export for request {RequestId}", requestId);

            // Update request status to failed
            await requestService.UpdateRequestStatusAsync(
                requestId,
                DataSubjectRequestStatus.InProgress,
                $"Export generation failed: {ex.Message}",
                "System",
                "System"
            );

            await requestService.RecordHistoryAsync(
                requestId,
                "ExportFailed",
                $"Error: {ex.Message}",
                "System",
                "System",
                null
            );

            throw; // Re-throw to let Hangfire handle retry
        }
    }
}
