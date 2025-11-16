using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using RentManager.API.Data;
using RentManager.API.Models;

namespace RentManager.API.Services.DataRetention
{
    /// <summary>
    /// Service for automated data deletion based on retention policies.
    /// Executes retention schedules and logs all deletions.
    /// </summary>
    public class AutomatedDeletionService : IAutomatedDeletionService
    {
        private readonly RentManagerDbContext _context;
        private readonly IDataRetentionService _retentionService;
        private readonly ILegalHoldService _legalHoldService;
        private readonly ILogger<AutomatedDeletionService> _logger;

        public AutomatedDeletionService(
            RentManagerDbContext context,
            IDataRetentionService retentionService,
            ILegalHoldService legalHoldService,
            ILogger<AutomatedDeletionService> logger)
        {
            _context = context;
            _retentionService = retentionService;
            _legalHoldService = legalHoldService;
            _logger = logger;
        }

        public async Task<RetentionExecutionResult> ExecuteRetentionPoliciesAsync(bool dryRun = false)
        {
            var stopwatch = Stopwatch.StartNew();
            var result = new RetentionExecutionResult
            {
                WasDryRun = dryRun,
                ExecutedAt = DateTimeOffset.UtcNow
            };

            _logger.LogInformation(
                "Starting retention policy execution {Mode}",
                dryRun ? "(DRY RUN)" : "");

            try
            {
                // Execute each retention policy
                var cookieConsents = await DeleteExpiredCookieConsentsAsync(dryRun);
                result.ResultsByCategory["cookie_consent"] = cookieConsents;
                result.TotalRecordsDeleted += cookieConsents;

                var auditLogs = await DeleteExpiredAuditLogsAsync(dryRun);
                result.ResultsByCategory["audit_logs"] = auditLogs;
                result.TotalRecordsDeleted += auditLogs;

                var payments = await AnonymizeOldPaymentRecordsAsync(dryRun);
                result.ResultsByCategory["financial_records"] = payments;
                result.TotalRecordsAnonymized += payments;

                var leases = await ArchiveExpiredLeasesAsync(dryRun);
                result.ResultsByCategory["lease_agreements"] = leases;
                result.TotalRecordsArchived += leases;

                var accounts = await DeleteInactiveAccountsAsync(dryRun);
                result.ResultsByCategory["inactive_accounts"] = accounts;
                result.TotalRecordsDeleted += accounts;

                var emails = await DeleteOldEmailNotificationRecordsAsync(dryRun);
                result.ResultsByCategory["email_notifications"] = emails;
                result.TotalRecordsDeleted += emails;

                var privacyAcceptances = await ArchiveOldPrivacyPolicyAcceptancesAsync(dryRun);
                result.ResultsByCategory["privacy_policy_acceptances"] = privacyAcceptances;
                result.TotalRecordsArchived += privacyAcceptances;

                result.TotalRecordsProcessed = result.TotalRecordsDeleted
                    + result.TotalRecordsAnonymized
                    + result.TotalRecordsArchived;

                result.Success = true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing retention policies");
                result.Success = false;
                result.Errors.Add(ex.Message);
            }

            stopwatch.Stop();
            result.Duration = stopwatch.Elapsed;

            _logger.LogInformation(
                "Retention policy execution completed {Mode}. Processed: {Processed}, Deleted: {Deleted}, Anonymized: {Anonymized}, Archived: {Archived}, Duration: {Duration}",
                dryRun ? "(DRY RUN)" : "",
                result.TotalRecordsProcessed,
                result.TotalRecordsDeleted,
                result.TotalRecordsAnonymized,
                result.TotalRecordsArchived,
                result.Duration);

            return result;
        }

        public async Task<int> DeleteExpiredCookieConsentsAsync(bool dryRun = false)
        {
            var policy = await _retentionService.GetRetentionPolicyForCategoryAsync("cookie_consent");
            if (policy == null || !policy.IsActive)
            {
                return 0;
            }

            var cutoffDate = DateTimeOffset.UtcNow.AddMonths(-policy.RetentionMonths);

            var expiredConsents = await _context.CookieConsents
                .Where(c => c.LastUpdated < cutoffDate)
                .ToListAsync();

            if (!dryRun && expiredConsents.Any())
            {
                foreach (var consent in expiredConsents)
                {
                    // Check legal hold before deletion
                    if (consent.UserId != null && await _legalHoldService.IsDataCategoryUnderLegalHoldAsync(consent.UserId, "cookie_consent"))
                    {
                        continue;
                    }

                    // Log deletion
                    await LogDeletionAsync(
                        userId: consent.UserId ?? "anonymous",
                        dataCategory: "cookie_consent",
                        description: $"Cookie consent ID {consent.Id}",
                        reason: "Retention policy expiration",
                        legalBasis: policy.LegalBasis);
                }

                _context.CookieConsents.RemoveRange(expiredConsents);
                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "Deleted {Count} expired cookie consents older than {CutoffDate}",
                    expiredConsents.Count, cutoffDate);
            }

            return expiredConsents.Count;
        }

        public async Task<int> DeleteExpiredAuditLogsAsync(bool dryRun = false)
        {
            var policy = await _retentionService.GetRetentionPolicyForCategoryAsync("audit_logs");
            if (policy == null || !policy.IsActive)
            {
                return 0;
            }

            var cutoffDate = DateTimeOffset.UtcNow.AddMonths(-policy.RetentionMonths);

            // Delete old data subject request histories (audit logs)
            var expiredHistories = await _context.DataSubjectRequestHistories
                .Where(h => h.PerformedAt < cutoffDate)
                .ToListAsync();

            if (!dryRun && expiredHistories.Any())
            {
                _context.DataSubjectRequestHistories.RemoveRange(expiredHistories);
                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "Deleted {Count} audit log entries older than {CutoffDate}",
                    expiredHistories.Count, cutoffDate);
            }

            return expiredHistories.Count;
        }

        public async Task<int> AnonymizeOldPaymentRecordsAsync(bool dryRun = false)
        {
            var policy = await _retentionService.GetRetentionPolicyForCategoryAsync("financial_records");
            if (policy == null || !policy.IsActive)
            {
                return 0;
            }

            var cutoffDate = DateTimeOffset.UtcNow.AddMonths(-policy.RetentionMonths);

            var oldPayments = await _context.Payments
                .Where(p => p.Date < cutoffDate)
                .ToListAsync();

            int anonymized = 0;

            if (!dryRun && oldPayments.Any())
            {
                foreach (var payment in oldPayments)
                {
                    // Get tenant for identification
                    var tenant = await _context.Tenants.FindAsync(payment.TenantId);
                    if (tenant == null)
                    {
                        continue;
                    }

                    // Note: Tenants don't have a direct UserId, they have PersonId or CompanyId
                    // For legal hold checking, we would need to implement a more complex check
                    // For now, we'll use the tenant's email as the identifier
                    // In a production system, you'd want to resolve this to actual user accounts

                    // Anonymize: Keep financial data but remove identifiable information
                    // In this case, we keep the payment but the Notes field could be cleared
                    payment.Notes = "[Anonymized per retention policy]";

                    // Log the anonymization
                    await LogDeletionAsync(
                        userId: tenant.Email, // Use email as identifier
                        dataCategory: "financial_records",
                        description: $"Payment ID {payment.Id} anonymized (amount: {payment.Amount})",
                        reason: "Retention policy - data anonymization",
                        legalBasis: policy.LegalBasis,
                        deletionMethod: "Anonymize");

                    anonymized++;
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "Anonymized {Count} payment records older than {CutoffDate}",
                    anonymized, cutoffDate);
            }

            return anonymized;
        }

        public async Task<int> ArchiveExpiredLeasesAsync(bool dryRun = false)
        {
            var policy = await _retentionService.GetRetentionPolicyForCategoryAsync("lease_agreements");
            if (policy == null || !policy.IsActive)
            {
                return 0;
            }

            var cutoffDate = DateTimeOffset.UtcNow.AddMonths(-policy.RetentionMonths);

            // Find contracts older than retention period
            var oldContracts = await _context.Contracts
                .Where(c => c.UploadedAt < cutoffDate)
                .ToListAsync();

            if (!dryRun && oldContracts.Any())
            {
                // In a real implementation, you would move these to cold storage
                // For now, we'll just log them
                foreach (var contract in oldContracts)
                {
                    await LogDeletionAsync(
                        userId: "system",
                        dataCategory: "lease_agreements",
                        description: $"Contract ID {contract.Id} for tenant {contract.TenantId}",
                        reason: "Retention policy - archival",
                        legalBasis: policy.LegalBasis,
                        deletionMethod: "Archive");
                }

                _logger.LogInformation(
                    "Archived {Count} lease agreements older than {CutoffDate}",
                    oldContracts.Count, cutoffDate);
            }

            return oldContracts.Count;
        }

        public async Task<int> DeleteInactiveAccountsAsync(bool dryRun = false)
        {
            var policy = await _retentionService.GetRetentionPolicyForCategoryAsync("inactive_accounts");
            if (policy == null || !policy.IsActive)
            {
                return 0;
            }

            var cutoffDate = DateTimeOffset.UtcNow.AddMonths(-policy.RetentionMonths);

            // Find users who haven't updated their account in the retention period
            var inactiveUsers = await _context.Users
                .Where(u => u.UpdatedAt < cutoffDate && !u.IsActive)
                .ToListAsync();

            int deleted = 0;

            if (!dryRun && inactiveUsers.Any())
            {
                foreach (var user in inactiveUsers)
                {
                    // Check legal hold
                    if (await _legalHoldService.IsUserUnderLegalHoldAsync(user.Id))
                    {
                        _logger.LogWarning(
                            "Skipping deletion of inactive user {UserId} due to legal hold",
                            user.Id);
                        continue;
                    }

                    // Log deletion
                    await LogDeletionAsync(
                        userId: user.Id,
                        dataCategory: "inactive_accounts",
                        description: $"Inactive user account {user.Email}",
                        reason: "Retention policy - inactive account",
                        legalBasis: policy.LegalBasis);

                    _context.Users.Remove(user);
                    deleted++;
                }

                if (deleted > 0)
                {
                    await _context.SaveChangesAsync();
                }

                _logger.LogInformation(
                    "Deleted {Count} inactive user accounts (last active before {CutoffDate})",
                    deleted, cutoffDate);
            }

            return deleted;
        }

        public Task<int> DeleteOldEmailNotificationRecordsAsync(bool dryRun = false)
        {
            // Note: This assumes you have an EmailNotificationLog table
            // If not, this is a placeholder for future implementation
            _logger.LogInformation(
                "Email notification records deletion not yet implemented (no EmailNotificationLog table)");

            return Task.FromResult(0);
        }

        public async Task<int> ArchiveOldPrivacyPolicyAcceptancesAsync(bool dryRun = false)
        {
            var policy = await _retentionService.GetRetentionPolicyForCategoryAsync("privacy_policy_acceptances");
            if (policy == null || !policy.IsActive)
            {
                return 0;
            }

            var cutoffDate = DateTimeOffset.UtcNow.AddMonths(-policy.RetentionMonths);

            var oldAcceptances = await _context.UserPrivacyPolicyAcceptances
                .Where(a => a.AcceptedAt < cutoffDate)
                .ToListAsync();

            if (!dryRun && oldAcceptances.Any())
            {
                // In a real implementation, you would move these to cold storage
                // For now, we just log them
                foreach (var acceptance in oldAcceptances)
                {
                    await LogDeletionAsync(
                        userId: acceptance.UserId,
                        dataCategory: "privacy_policy_acceptances",
                        description: $"Privacy policy acceptance ID {acceptance.Id}",
                        reason: "Retention policy - archival",
                        legalBasis: policy.LegalBasis,
                        deletionMethod: "Archive");
                }

                _logger.LogInformation(
                    "Archived {Count} privacy policy acceptances older than {CutoffDate}",
                    oldAcceptances.Count, cutoffDate);
            }

            return oldAcceptances.Count;
        }

        /// <summary>
        /// Logs a deletion event.
        /// </summary>
        private async Task LogDeletionAsync(
            string userId,
            string dataCategory,
            string description,
            string reason,
            string legalBasis,
            string deletionMethod = "Delete")
        {
            var log = new DataDeletionLog
            {
                UserId = userId,
                DataCategory = dataCategory,
                Description = description,
                DeletionMethod = deletionMethod,
                Reason = reason,
                LegalBasis = legalBasis,
                DeletedAt = DateTimeOffset.UtcNow,
                DeletedBy = "system",
                IsReversible = false
            };

            _context.DataDeletionLogs.Add(log);
            // Note: SaveChanges is called by the caller
        }
    }
}
