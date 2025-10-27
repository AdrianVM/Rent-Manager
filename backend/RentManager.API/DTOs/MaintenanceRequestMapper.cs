using RentManager.API.Models;

namespace RentManager.API.DTOs
{
    public static class MaintenanceRequestMapper
    {
        public static MaintenanceRequestDto ToDto(MaintenanceRequest request)
        {
            return new MaintenanceRequestDto
            {
                Id = request.Id,
                TenantId = request.TenantId,
                TenantName = request.Tenant?.Name ?? "Unknown",
                PropertyId = request.PropertyId,
                PropertyName = request.Property?.Name ?? "Unknown",
                PropertyAddress = request.Property?.Address ?? "Unknown",
                Title = request.Title,
                Description = request.Description,
                Status = request.Status.ToString(),
                Priority = request.Priority.ToString(),
                ResolvedAt = request.ResolvedAt,
                AssignedTo = request.AssignedTo,
                ResolutionNotes = request.ResolutionNotes,
                CreatedAt = request.CreatedAt,
                UpdatedAt = request.UpdatedAt
            };
        }

        public static List<MaintenanceRequestDto> ToDto(IEnumerable<MaintenanceRequest> requests)
        {
            return requests.Select(ToDto).ToList();
        }

        public static MaintenanceRequest ToEntity(MaintenanceRequestCreateDto dto)
        {
            return new MaintenanceRequest
            {
                TenantId = dto.TenantId,
                PropertyId = dto.PropertyId,
                Title = dto.Title,
                Description = dto.Description,
                Priority = Enum.Parse<MaintenancePriority>(dto.Priority),
                Status = MaintenanceStatus.Pending
            };
        }

        public static void UpdateEntity(MaintenanceRequest entity, MaintenanceRequestUpdateDto dto)
        {
            entity.Title = dto.Title;
            entity.Description = dto.Description;
            entity.Status = Enum.Parse<MaintenanceStatus>(dto.Status);
            entity.Priority = Enum.Parse<MaintenancePriority>(dto.Priority);
            entity.AssignedTo = dto.AssignedTo;
            entity.ResolutionNotes = dto.ResolutionNotes;
            entity.UpdatedAt = DateTimeOffset.UtcNow;

            if (entity.Status == MaintenanceStatus.Completed && entity.ResolvedAt == null)
            {
                entity.ResolvedAt = DateTimeOffset.UtcNow;
            }
        }
    }
}
