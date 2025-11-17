using Microsoft.EntityFrameworkCore;
using RentManager.API.Data;
using RentManager.API.Models;

namespace RentManager.API.Services;

public interface IPrivacyPolicyService
{
    Task<PrivacyPolicyVersion?> GetCurrentPolicyAsync();
    Task<PrivacyPolicyVersion?> GetPolicyVersionAsync(int versionId);
    Task<List<PrivacyPolicyVersion>> GetAllVersionsAsync();
    Task<PrivacyPolicyVersion> CreatePolicyVersionAsync(PrivacyPolicyVersion policyVersion);
    Task<bool> CheckUserAcceptanceRequiredAsync(string userId);
    Task<List<UserPrivacyPolicyAcceptance>> GetUserAcceptanceHistoryAsync(string userId);
    Task<UserPrivacyPolicyAcceptance> RecordAcceptanceAsync(string userId, int policyVersionId, string? ipAddress, string? userAgent, string? acceptanceMethod);
    Task<UserPrivacyPolicyAcceptance?> GetUserCurrentAcceptanceAsync(string userId);
    Task<bool> HasUserAcceptedCurrentPolicyAsync(string userId);
}

public class PrivacyPolicyService : IPrivacyPolicyService
{
    private readonly IUnitOfWork _context;

    public PrivacyPolicyService(IUnitOfWork context)
    {
        _context = context;
    }

    public async Task<PrivacyPolicyVersion?> GetCurrentPolicyAsync()
    {
        return await _context.PrivacyPolicyVersions
            .Where(p => p.IsCurrent && p.EffectiveDate <= DateTimeOffset.UtcNow)
            .OrderByDescending(p => p.EffectiveDate)
            .FirstOrDefaultAsync();
    }

    public async Task<PrivacyPolicyVersion?> GetPolicyVersionAsync(int versionId)
    {
        return await _context.PrivacyPolicyVersions
            .FirstOrDefaultAsync(p => p.Id == versionId);
    }

    public async Task<List<PrivacyPolicyVersion>> GetAllVersionsAsync()
    {
        return await _context.PrivacyPolicyVersions
            .OrderByDescending(p => p.EffectiveDate)
            .ToListAsync();
    }

    public async Task<PrivacyPolicyVersion> CreatePolicyVersionAsync(PrivacyPolicyVersion policyVersion)
    {
        // If this is set as current, unset other current versions
        if (policyVersion.IsCurrent)
        {
            var currentPolicies = await _context.PrivacyPolicyVersions
                .Where(p => p.IsCurrent)
                .ToListAsync();

            foreach (var policy in currentPolicies)
            {
                policy.IsCurrent = false;
            }
        }

        _context.PrivacyPolicyVersions.Add(policyVersion);
        await _context.SaveChangesAsync();

        return policyVersion;
    }

    public async Task<bool> CheckUserAcceptanceRequiredAsync(string userId)
    {
        var currentPolicy = await GetCurrentPolicyAsync();
        if (currentPolicy == null)
        {
            return false; // No policy to accept
        }

        var hasAccepted = await _context.UserPrivacyPolicyAcceptances
            .AnyAsync(a => a.UserId == userId && a.PolicyVersionId == currentPolicy.Id);

        return !hasAccepted;
    }

    public async Task<List<UserPrivacyPolicyAcceptance>> GetUserAcceptanceHistoryAsync(string userId)
    {
        return await _context.UserPrivacyPolicyAcceptances
            .Include(a => a.PolicyVersion)
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.AcceptedAt)
            .ToListAsync();
    }

    public async Task<UserPrivacyPolicyAcceptance> RecordAcceptanceAsync(
        string userId,
        int policyVersionId,
        string? ipAddress,
        string? userAgent,
        string? acceptanceMethod)
    {
        // Check if already accepted
        var existing = await _context.UserPrivacyPolicyAcceptances
            .FirstOrDefaultAsync(a => a.UserId == userId && a.PolicyVersionId == policyVersionId);

        if (existing != null)
        {
            return existing; // Already accepted
        }

        var acceptance = new UserPrivacyPolicyAcceptance
        {
            UserId = userId,
            PolicyVersionId = policyVersionId,
            AcceptedAt = DateTimeOffset.UtcNow,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            AcceptanceMethod = acceptanceMethod ?? "explicit",
            WasShownChangesSummary = false
        };

        _context.UserPrivacyPolicyAcceptances.Add(acceptance);
        await _context.SaveChangesAsync();

        return acceptance;
    }

    public async Task<UserPrivacyPolicyAcceptance?> GetUserCurrentAcceptanceAsync(string userId)
    {
        var currentPolicy = await GetCurrentPolicyAsync();
        if (currentPolicy == null)
        {
            return null;
        }

        return await _context.UserPrivacyPolicyAcceptances
            .Include(a => a.PolicyVersion)
            .FirstOrDefaultAsync(a => a.UserId == userId && a.PolicyVersionId == currentPolicy.Id);
    }

    public async Task<bool> HasUserAcceptedCurrentPolicyAsync(string userId)
    {
        var acceptance = await GetUserCurrentAcceptanceAsync(userId);
        return acceptance != null;
    }
}
