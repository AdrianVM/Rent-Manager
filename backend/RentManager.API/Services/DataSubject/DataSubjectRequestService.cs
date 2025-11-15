using Microsoft.EntityFrameworkCore;
using RentManager.API.Data;
using RentManager.API.Models;

namespace RentManager.API.Services.DataSubject;

public interface IDataSubjectRequestService
{
    Task<DataSubjectRequest> CreateRequestAsync(string userId, string requestType, string? description, string? ipAddress, string? userAgent);
    Task<DataSubjectRequest?> GetRequestByIdAsync(int requestId, string? userId = null);
    Task<List<DataSubjectRequest>> GetUserRequestsAsync(string userId);
    Task<List<DataSubjectRequest>> GetPendingRequestsAsync();
    Task<List<DataSubjectRequest>> GetRequestsNearingDeadlineAsync(int daysThreshold = 7);
    Task<DataSubjectRequest> UpdateRequestStatusAsync(int requestId, string newStatus, string? adminNotes, string? performedBy, string? performedByRole);
    Task<DataSubjectRequest> AssignRequestAsync(int requestId, string adminId, string? performedBy);
    Task RecordHistoryAsync(int requestId, string action, string? details, string? performedBy, string? performedByRole, string? ipAddress, string? oldStatus = null, string? newStatus = null);
    Task<bool> HasPendingRequestOfTypeAsync(string userId, string requestType);
}

public class DataSubjectRequestService : IDataSubjectRequestService
{
    private readonly RentManagerDbContext _context;
    private readonly ILogger<DataSubjectRequestService> _logger;

    public DataSubjectRequestService(
        RentManagerDbContext context,
        ILogger<DataSubjectRequestService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Creates a new data subject request
    /// </summary>
    public async Task<DataSubjectRequest> CreateRequestAsync(
        string userId,
        string requestType,
        string? description,
        string? ipAddress,
        string? userAgent)
    {
        // Validate request type
        if (!DataSubjectRequestType.All.Contains(requestType))
        {
            throw new ArgumentException($"Invalid request type: {requestType}");
        }

        // Check if user already has a pending request of this type
        var hasPending = await HasPendingRequestOfTypeAsync(userId, requestType);
        if (hasPending)
        {
            throw new InvalidOperationException($"User already has a pending {requestType} request");
        }

        var now = DateTimeOffset.UtcNow;
        var request = new DataSubjectRequest
        {
            UserId = userId,
            RequestType = requestType,
            Description = description,
            Status = DataSubjectRequestStatus.Pending,
            SubmittedAt = now,
            DeadlineAt = now.AddDays(30), // GDPR requires response within 30 days
            IpAddress = ipAddress,
            UserAgent = userAgent,
            IdentityVerified = true, // User is authenticated
            VerificationMethod = "authenticated-session",
            VerifiedAt = now
        };

        _context.DataSubjectRequests.Add(request);
        await _context.SaveChangesAsync();

        // Record creation in history
        await RecordHistoryAsync(
            request.Id,
            "Created",
            $"User submitted {requestType} request",
            userId,
            "User",
            ipAddress
        );

        _logger.LogInformation(
            "Data subject request created. RequestId: {RequestId}, UserId: {UserId}, Type: {RequestType}",
            request.Id,
            userId,
            requestType
        );

        return request;
    }

    /// <summary>
    /// Gets a request by ID, optionally filtered by user
    /// </summary>
    public async Task<DataSubjectRequest?> GetRequestByIdAsync(int requestId, string? userId = null)
    {
        var query = _context.DataSubjectRequests
            .Include(r => r.History.OrderByDescending(h => h.PerformedAt))
            .AsQueryable();

        if (userId != null)
        {
            query = query.Where(r => r.UserId == userId);
        }

        return await query.FirstOrDefaultAsync(r => r.Id == requestId);
    }

    /// <summary>
    /// Gets all requests for a specific user
    /// </summary>
    public async Task<List<DataSubjectRequest>> GetUserRequestsAsync(string userId)
    {
        return await _context.DataSubjectRequests
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.SubmittedAt)
            .ToListAsync();
    }

    /// <summary>
    /// Gets all pending requests for admin review
    /// </summary>
    public async Task<List<DataSubjectRequest>> GetPendingRequestsAsync()
    {
        return await _context.DataSubjectRequests
            .Where(r => r.Status == DataSubjectRequestStatus.Pending || r.Status == DataSubjectRequestStatus.InProgress)
            .OrderBy(r => r.DeadlineAt)
            .ToListAsync();
    }

    /// <summary>
    /// Gets requests nearing their deadline
    /// </summary>
    public async Task<List<DataSubjectRequest>> GetRequestsNearingDeadlineAsync(int daysThreshold = 7)
    {
        var thresholdDate = DateTimeOffset.UtcNow.AddDays(daysThreshold);

        return await _context.DataSubjectRequests
            .Where(r =>
                (r.Status == DataSubjectRequestStatus.Pending || r.Status == DataSubjectRequestStatus.InProgress) &&
                r.DeadlineAt <= thresholdDate)
            .OrderBy(r => r.DeadlineAt)
            .ToListAsync();
    }

    /// <summary>
    /// Updates request status with admin notes
    /// </summary>
    public async Task<DataSubjectRequest> UpdateRequestStatusAsync(
        int requestId,
        string newStatus,
        string? adminNotes,
        string? performedBy,
        string? performedByRole)
    {
        // Validate status
        if (!DataSubjectRequestStatus.All.Contains(newStatus))
        {
            throw new ArgumentException($"Invalid status: {newStatus}");
        }

        var request = await _context.DataSubjectRequests.FindAsync(requestId);
        if (request == null)
        {
            throw new KeyNotFoundException($"Request {requestId} not found");
        }

        var oldStatus = request.Status;
        request.Status = newStatus;

        if (adminNotes != null)
        {
            request.AdminNotes = adminNotes;
        }

        if (newStatus == DataSubjectRequestStatus.Completed || newStatus == DataSubjectRequestStatus.Rejected)
        {
            request.CompletedAt = DateTimeOffset.UtcNow;
        }

        await _context.SaveChangesAsync();

        // Record status change in history
        await RecordHistoryAsync(
            requestId,
            "StatusChanged",
            adminNotes,
            performedBy,
            performedByRole,
            null,
            oldStatus,
            newStatus
        );

        _logger.LogInformation(
            "Request status updated. RequestId: {RequestId}, OldStatus: {OldStatus}, NewStatus: {NewStatus}",
            requestId,
            oldStatus,
            newStatus
        );

        return request;
    }

    /// <summary>
    /// Assigns a request to an admin
    /// </summary>
    public async Task<DataSubjectRequest> AssignRequestAsync(int requestId, string adminId, string? performedBy)
    {
        var request = await _context.DataSubjectRequests.FindAsync(requestId);
        if (request == null)
        {
            throw new KeyNotFoundException($"Request {requestId} not found");
        }

        var previousAdminId = request.AssignedToAdminId;
        request.AssignedToAdminId = adminId;

        // If moving from Pending to assigned, update status to InProgress
        if (request.Status == DataSubjectRequestStatus.Pending)
        {
            request.Status = DataSubjectRequestStatus.InProgress;
        }

        await _context.SaveChangesAsync();

        // Record assignment in history
        await RecordHistoryAsync(
            requestId,
            "Assigned",
            $"Request assigned to admin {adminId}" + (previousAdminId != null ? $" (previously: {previousAdminId})" : ""),
            performedBy,
            "Admin",
            null
        );

        _logger.LogInformation(
            "Request assigned. RequestId: {RequestId}, AssignedTo: {AdminId}",
            requestId,
            adminId
        );

        return request;
    }

    /// <summary>
    /// Records an action in the request history
    /// </summary>
    public async Task RecordHistoryAsync(
        int requestId,
        string action,
        string? details,
        string? performedBy,
        string? performedByRole,
        string? ipAddress,
        string? oldStatus = null,
        string? newStatus = null)
    {
        var history = new DataSubjectRequestHistory
        {
            RequestId = requestId,
            Action = action,
            Details = details,
            PerformedBy = performedBy,
            PerformedByRole = performedByRole,
            IpAddress = ipAddress,
            OldStatus = oldStatus,
            NewStatus = newStatus,
            PerformedAt = DateTimeOffset.UtcNow
        };

        _context.DataSubjectRequestHistories.Add(history);
        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// Checks if user has a pending request of a specific type
    /// </summary>
    public async Task<bool> HasPendingRequestOfTypeAsync(string userId, string requestType)
    {
        return await _context.DataSubjectRequests
            .AnyAsync(r =>
                r.UserId == userId &&
                r.RequestType == requestType &&
                (r.Status == DataSubjectRequestStatus.Pending || r.Status == DataSubjectRequestStatus.InProgress));
    }
}
