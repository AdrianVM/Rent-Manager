using RentManager.API.DTOs.DataSubjectRequest;
using RentManager.API.Models;

namespace RentManager.API.Mappers;

/// <summary>
/// Mapper for converting DataSubjectRequest entities to DTOs
/// </summary>
public static class DataSubjectRequestMapper
{
    public static DataSubjectRequestDto ToDto(this DataSubjectRequest entity)
    {
        return new DataSubjectRequestDto
        {
            Id = entity.Id,
            UserId = entity.UserId,
            RequestType = entity.RequestType,
            Status = entity.Status,
            Description = entity.Description,
            SubmittedAt = entity.SubmittedAt,
            DeadlineAt = entity.DeadlineAt,
            CompletedAt = entity.CompletedAt,
            IpAddress = entity.IpAddress,
            AssignedToAdminId = entity.AssignedToAdminId,
            AdminNotes = entity.AdminNotes,
            ExportFilePath = entity.ExportFilePath,
            ExportExpiresAt = entity.ExportExpiresAt,
            DeletionSummary = entity.DeletionSummary,
            RetentionSummary = entity.RetentionSummary,
            IdentityVerified = entity.IdentityVerified,
            VerificationMethod = entity.VerificationMethod,
            VerifiedAt = entity.VerifiedAt,
            History = entity.History?.Select(h => h.ToDto()).ToList() ?? new List<DataSubjectRequestHistoryDto>()
        };
    }

    public static DataSubjectRequestHistoryDto ToDto(this DataSubjectRequestHistory entity)
    {
        return new DataSubjectRequestHistoryDto
        {
            Id = entity.Id,
            RequestId = entity.RequestId,
            Action = entity.Action,
            OldStatus = entity.OldStatus,
            NewStatus = entity.NewStatus,
            Details = entity.Details,
            PerformedBy = entity.PerformedBy,
            PerformedByRole = entity.PerformedByRole,
            PerformedAt = entity.PerformedAt,
            IpAddress = entity.IpAddress
        };
    }

    public static List<DataSubjectRequestDto> ToDto(this IEnumerable<DataSubjectRequest> entities)
    {
        return entities.Select(e => e.ToDto()).ToList();
    }
}
