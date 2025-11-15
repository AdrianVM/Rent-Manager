namespace RentManager.API.DTOs.DataSubjectRequest;

/// <summary>
/// DTO for data subject request responses
/// </summary>
public class DataSubjectRequestDto
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string RequestType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTimeOffset SubmittedAt { get; set; }
    public DateTimeOffset DeadlineAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public string? IpAddress { get; set; }
    public string? AssignedToAdminId { get; set; }
    public string? AdminNotes { get; set; }
    public string? ExportFilePath { get; set; }
    public DateTimeOffset? ExportExpiresAt { get; set; }
    public string? DeletionSummary { get; set; }
    public string? RetentionSummary { get; set; }
    public bool IdentityVerified { get; set; }
    public string? VerificationMethod { get; set; }
    public DateTimeOffset? VerifiedAt { get; set; }

    // History as a simple list without circular reference
    public List<DataSubjectRequestHistoryDto> History { get; set; } = new();
}

/// <summary>
/// DTO for request history entries
/// </summary>
public class DataSubjectRequestHistoryDto
{
    public int Id { get; set; }
    public int RequestId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? OldStatus { get; set; }
    public string? NewStatus { get; set; }
    public string? Details { get; set; }
    public string? PerformedBy { get; set; }
    public string? PerformedByRole { get; set; }
    public DateTimeOffset PerformedAt { get; set; }
    public string? IpAddress { get; set; }
}

/// <summary>
/// DTO for creating a new data subject request
/// </summary>
public class CreateDataSubjectRequestDto
{
    public string RequestType { get; set; } = string.Empty;
    public string? Description { get; set; }
}

/// <summary>
/// DTO for updating request status (admin only)
/// </summary>
public class UpdateRequestStatusDto
{
    public string Status { get; set; } = string.Empty;
    public string? AdminNotes { get; set; }
}

/// <summary>
/// DTO for deletion preview response
/// </summary>
public class DeletionPreviewDto
{
    public List<DataCategoryDto> DeletableData { get; set; } = new();
    public List<RetainedDataDto> RetainedData { get; set; } = new();
    public string Summary { get; set; } = string.Empty;
}

/// <summary>
/// DTO for data category information
/// </summary>
public class DataCategoryDto
{
    public string Category { get; set; } = string.Empty;
    public int Count { get; set; }
    public string Description { get; set; } = string.Empty;
}

/// <summary>
/// DTO for retained data information
/// </summary>
public class RetainedDataDto
{
    public string Category { get; set; } = string.Empty;
    public int Count { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string LegalBasis { get; set; } = string.Empty;
    public DateTimeOffset RetainUntil { get; set; }
}

/// <summary>
/// DTO for assigning a request to an admin
/// </summary>
public class AssignRequestDto
{
    public string AssignToAdminId { get; set; } = string.Empty;
}
