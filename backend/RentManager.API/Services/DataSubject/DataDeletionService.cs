using Microsoft.EntityFrameworkCore;
using RentManager.API.Data;
using RentManager.API.Models;

namespace RentManager.API.Services.DataSubject;

public interface IDataDeletionService
{
    Task<Dictionary<string, string>> IdentifyDeletableDataAsync(string userId);
    Task<Dictionary<string, string>> IdentifyRetainableDataAsync(string userId);
    Task<(string DeletionSummary, string RetentionSummary)> ExecuteDeletionAsync(string userId, string adminId, int? relatedRequestId = null);
    Task<string> AnonymizeUserDataAsync(string userId, string reason);
}

public class DataDeletionService : IDataDeletionService
{
    private readonly IUnitOfWork _context;
    private readonly ILogger<DataDeletionService> _logger;

    public DataDeletionService(
        IUnitOfWork context,
        ILogger<DataDeletionService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Identifies data that can be safely deleted
    /// </summary>
    public async Task<Dictionary<string, string>> IdentifyDeletableDataAsync(string userId)
    {
        var deletable = new Dictionary<string, string>();

        // User profile - can be anonymized
        var user = await _context.Users.FindAsync(userId);
        if (user != null)
        {
            deletable["user_profile"] = "Profile information will be anonymized";
        }

        // Cookie consents - can be deleted (retention: 2 years, but user request overrides)
        var cookieConsentCount = await _context.CookieConsents.CountAsync(cc => cc.UserId == userId);
        if (cookieConsentCount > 0)
        {
            deletable["cookie_consents"] = $"{cookieConsentCount} cookie consent records will be deleted";
        }

        // Privacy acceptances older than required retention
        var oldAcceptances = await _context.UserPrivacyPolicyAcceptances
            .Where(pa => pa.UserId == userId && pa.AcceptedAt < DateTimeOffset.UtcNow.AddYears(-2))
            .CountAsync();
        if (oldAcceptances > 0)
        {
            deletable["old_privacy_acceptances"] = $"{oldAcceptances} privacy acceptances older than 2 years will be deleted";
        }

        // Maintenance requests (non-financial, can be anonymized)
        var maintenanceCount = await _context.MaintenanceRequests
            .CountAsync(mr => _context.Tenants.Any(t => t.Id == mr.TenantId &&
                _context.Users.Any(u => u.Id == userId && (u.Email == t.Email || u.PersonId == t.PersonId))));
        if (maintenanceCount > 0)
        {
            deletable["maintenance_requests"] = $"{maintenanceCount} maintenance requests will be anonymized";
        }

        return deletable;
    }

    /// <summary>
    /// Identifies data that must be retained for legal/business reasons
    /// </summary>
    public async Task<Dictionary<string, string>> IdentifyRetainableDataAsync(string userId)
    {
        var retainable = new Dictionary<string, string>();

        // Financial records - must retain for 7 years (tax compliance)
        var tenantIds = await _context.Tenants
            .Where(t => _context.Users.Any(u => u.Id == userId && (u.Email == t.Email || u.PersonId == t.PersonId)))
            .Select(t => t.Id)
            .ToListAsync();

        if (tenantIds.Any())
        {
            var paymentCount = await _context.Payments
                .Where(p => tenantIds.Contains(p.TenantId))
                .CountAsync();

            if (paymentCount > 0)
            {
                retainable["payments"] = $"{paymentCount} payment records must be retained for 7 years (tax compliance)";
            }

            // Lease agreements - must retain for 7 years
            var tenantCount = await _context.Tenants
                .Where(t => tenantIds.Contains(t.Id))
                .CountAsync();

            if (tenantCount > 0)
            {
                retainable["leases"] = $"{tenantCount} lease records must be retained for 7 years (legal requirement)";
            }

            // Contracts - must retain for 7 years
            var contractCount = await _context.Contracts
                .Where(c => tenantIds.Contains(c.TenantId))
                .CountAsync();

            if (contractCount > 0)
            {
                retainable["contracts"] = $"{contractCount} contract documents must be retained for 7 years (legal requirement)";
            }
        }

        // Recent privacy policy acceptances - must retain for 2 years (proof of consent)
        var recentAcceptances = await _context.UserPrivacyPolicyAcceptances
            .Where(pa => pa.UserId == userId && pa.AcceptedAt >= DateTimeOffset.UtcNow.AddYears(-2))
            .CountAsync();

        if (recentAcceptances > 0)
        {
            retainable["recent_privacy_acceptances"] = $"{recentAcceptances} recent privacy acceptances must be retained for 2 years (GDPR Article 7)";
        }

        // Data subject requests - must retain for audit trail
        var requestCount = await _context.DataSubjectRequests
            .CountAsync(dr => dr.UserId == userId);

        if (requestCount > 0)
        {
            retainable["data_requests"] = $"{requestCount} data subject request records must be retained for audit purposes";
        }

        return retainable;
    }

    /// <summary>
    /// Executes deletion and anonymization of user data
    /// </summary>
    public async Task<(string DeletionSummary, string RetentionSummary)> ExecuteDeletionAsync(
        string userId,
        string adminId,
        int? relatedRequestId = null)
    {
        _logger.LogWarning("Starting data deletion for user {UserId} by admin {AdminId}", userId, adminId);

        var deletedItems = new List<string>();
        var retainedItems = new List<string>();

        // Get user info before deletion
        var user = await _context.Users.Include(u => u.Person).FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null)
        {
            throw new KeyNotFoundException($"User {userId} not found");
        }

        // 1. Delete old cookie consents
        var cookieConsents = await _context.CookieConsents.Where(cc => cc.UserId == userId).ToListAsync();
        if (cookieConsents.Any())
        {
            _context.CookieConsents.RemoveRange(cookieConsents);
            await LogDeletionAsync(userId, "cookie_consents", $"Deleted {cookieConsents.Count} cookie consent records",
                cookieConsents.Count, "Deleted", "UserRequest", "GDPR Article 17", adminId, relatedRequestId);
            deletedItems.Add($"{cookieConsents.Count} cookie consent records");
        }

        // 2. Delete old privacy policy acceptances (>2 years)
        var oldAcceptances = await _context.UserPrivacyPolicyAcceptances
            .Where(pa => pa.UserId == userId && pa.AcceptedAt < DateTimeOffset.UtcNow.AddYears(-2))
            .ToListAsync();
        if (oldAcceptances.Any())
        {
            _context.UserPrivacyPolicyAcceptances.RemoveRange(oldAcceptances);
            await LogDeletionAsync(userId, "old_privacy_acceptances", $"Deleted {oldAcceptances.Count} old privacy acceptances",
                oldAcceptances.Count, "Deleted", "UserRequest", "GDPR Article 17", adminId, relatedRequestId);
            deletedItems.Add($"{oldAcceptances.Count} old privacy acceptances (>2 years)");
        }

        // 3. Keep recent privacy acceptances (legal requirement)
        var recentAcceptances = await _context.UserPrivacyPolicyAcceptances
            .Where(pa => pa.UserId == userId && pa.AcceptedAt >= DateTimeOffset.UtcNow.AddYears(-2))
            .CountAsync();
        if (recentAcceptances > 0)
        {
            retainedItems.Add($"{recentAcceptances} recent privacy acceptances (required for 2 years per GDPR Article 7)");
        }

        // 4. Anonymize maintenance requests
        var tenantIds = await _context.Tenants
            .Where(t => _context.Users.Any(u => u.Id == userId && (u.Email == t.Email || u.PersonId == t.PersonId)))
            .Select(t => t.Id)
            .ToListAsync();

        if (tenantIds.Any())
        {
            var maintenanceRequests = await _context.MaintenanceRequests
                .Where(mr => tenantIds.Contains(mr.TenantId))
                .ToListAsync();

            if (maintenanceRequests.Any())
            {
                foreach (var mr in maintenanceRequests)
                {
                    mr.Description = "[REDACTED - User requested deletion]";
                    mr.ResolutionNotes = mr.ResolutionNotes != null ? "[REDACTED - User requested deletion]" : null;
                }
                await LogDeletionAsync(userId, "maintenance_requests", $"Anonymized {maintenanceRequests.Count} maintenance requests",
                    maintenanceRequests.Count, "Anonymized", "UserRequest", "GDPR Article 17", adminId, relatedRequestId);
                deletedItems.Add($"{maintenanceRequests.Count} maintenance requests (anonymized)");
            }

            // 5. Keep financial records (legal requirement)
            var paymentCount = await _context.Payments.CountAsync(p => tenantIds.Contains(p.TenantId));
            if (paymentCount > 0)
            {
                retainedItems.Add($"{paymentCount} payment records (required for 7 years per tax law)");
            }

            var tenantCount = tenantIds.Count;
            retainedItems.Add($"{tenantCount} lease records (required for 7 years per legal requirement)");

            var contractCount = await _context.Contracts.CountAsync(c => tenantIds.Contains(c.TenantId));
            if (contractCount > 0)
            {
                retainedItems.Add($"{contractCount} contracts (required for 7 years per legal requirement)");
            }
        }

        // 6. Anonymize user profile
        user.Email = $"deleted-{userId}@anonymized.local";
        user.PasswordHash = "REDACTED";
        user.IsActive = false;

        if (user.Person != null)
        {
            user.Person.FirstName = "REDACTED";
            user.Person.MiddleName = null!;
            user.Person.LastName = "REDACTED";
            user.Person.IdNumber = null;
            user.Person.Phone = null;
            user.Person.Occupation = null;
        }

        await LogDeletionAsync(userId, "user_profile", "User profile anonymized",
            1, "Anonymized", "UserRequest", "GDPR Article 17", adminId, relatedRequestId: relatedRequestId);
        deletedItems.Add("User profile (anonymized)");

        // 7. Keep data subject requests for audit trail
        var requestCount = await _context.DataSubjectRequests.CountAsync(dr => dr.UserId == userId);
        if (requestCount > 0)
        {
            retainedItems.Add($"{requestCount} data subject request records (required for audit trail)");
        }

        await _context.SaveChangesAsync();

        var deletionSummary = deletedItems.Any()
            ? string.Join("; ", deletedItems)
            : "No data deleted";

        var retentionSummary = retainedItems.Any()
            ? string.Join("; ", retainedItems)
            : "No data retained";

        _logger.LogWarning(
            "Data deletion completed for user {UserId}. Deleted: {DeletionSummary}. Retained: {RetentionSummary}",
            userId,
            deletionSummary,
            retentionSummary
        );

        return (deletionSummary, retentionSummary);
    }

    /// <summary>
    /// Anonymizes user data without full deletion (softer approach)
    /// </summary>
    public async Task<string> AnonymizeUserDataAsync(string userId, string reason)
    {
        var user = await _context.Users.Include(u => u.Person).FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null)
        {
            throw new KeyNotFoundException($"User {userId} not found");
        }

        user.Email = $"anonymized-{userId}@anonymized.local";
        user.PasswordHash = "ANONYMIZED";
        user.IsActive = false;

        if (user.Person != null)
        {
            user.Person.FirstName = "Anonymous";
            user.Person.LastName = "User";
            user.Person.MiddleName = null!;
            user.Person.IdNumber = null;
            user.Person.Phone = null;
        }

        await _context.SaveChangesAsync();

        await LogDeletionAsync(userId, "user_profile", "User profile anonymized",
            1, "Anonymized", reason, "Data minimization", "System", relatedRequestId: null);

        _logger.LogInformation("User {UserId} anonymized. Reason: {Reason}", userId, reason);

        return "User profile anonymized successfully";
    }

    private async Task LogDeletionAsync(
        string userId,
        string dataCategory,
        string description,
        int recordCount,
        string deletionMethod,
        string reason,
        string legalBasis,
        string deletedBy,
        int? relatedRequestId)
    {
        var log = new DataDeletionLog
        {
            UserId = userId,
            DataCategory = dataCategory,
            Description = description,
            RecordCount = recordCount,
            DeletionMethod = deletionMethod,
            Reason = reason,
            LegalBasis = legalBasis,
            DeletedBy = deletedBy,
            RelatedRequestId = relatedRequestId,
            DeletedAt = DateTimeOffset.UtcNow,
            IsReversible = false
        };

        _context.DataDeletionLogs.Add(log);
        await _context.SaveChangesAsync();
    }
}
