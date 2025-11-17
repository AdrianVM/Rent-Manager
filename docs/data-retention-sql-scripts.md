# Data Retention SQL Scripts

## Overview
This document contains pre-written, tested SQL scripts for manually executing data retention policies. These scripts should be run quarterly by system administrators to maintain GDPR compliance.

**IMPORTANT:** Always run these scripts within a transaction and verify legal holds before execution.

---

## Quick Start Checklist

Before running any retention scripts:

1. ✅ Backup database
2. ✅ Check active legal holds: `SELECT * FROM LegalHolds WHERE IsActive = 1`
3. ✅ Review pending data subject requests
4. ✅ Note current date and admin user ID for audit logs

---

## Utility Scripts

### 1. Check All Active Legal Holds

Run this first to identify any users/data that must NOT be deleted:

```sql
-- View all active legal holds
SELECT
    Id,
    UserId,
    DataCategory,
    Reason,
    CaseReference,
    PlacedAt,
    PlacedBy,
    ReviewDate
FROM LegalHolds
WHERE IsActive = 1
ORDER BY PlacedAt DESC;
```

### 2. View Current Retention Policies

```sql
-- View all active retention policies
SELECT
    Id,
    DataCategory,
    Description,
    RetentionMonths,
    LegalBasis,
    Action,
    IsActive
FROM DataRetentionSchedules
WHERE IsActive = 1
ORDER BY DataCategory;
```

### 3. Generate Recent Deletion Summary

Run after quarterly execution to document what was deleted:

```sql
-- Summary of deletions in last 7 days
SELECT
    CAST(DeletedAt AS DATE) AS DeletionDate,
    DataCategory,
    DeletionMethod,
    SUM(COALESCE(RecordCount, 1)) AS TotalRecords,
    Reason
FROM DataDeletionLogs
WHERE DeletedAt >= DATEADD(DAY, -7, GETUTCDATE())
GROUP BY CAST(DeletedAt AS DATE), DataCategory, DeletionMethod, Reason
ORDER BY DeletionDate DESC, DataCategory;
```

---

## Retention Execution Scripts

### Policy 1: Cookie Consents (12 months retention)

**Retention Period:** 12 months
**Action:** Delete
**Run:** Quarterly

```sql
BEGIN TRANSACTION;

-- Check for legal holds
DECLARE @HasLegalHolds INT;
SELECT @HasLegalHolds = COUNT(*)
FROM LegalHolds
WHERE IsActive = 1 AND (DataCategory = 'cookie_consent' OR DataCategory IS NULL);

IF @HasLegalHolds > 0
BEGIN
    PRINT 'WARNING: Legal holds exist for cookie_consent. Review holds before proceeding.';
    ROLLBACK;
    RETURN;
END

-- Identify records to delete
DECLARE @CutoffDate DATETIMEOFFSET = DATEADD(MONTH, -12, GETUTCDATE());
DECLARE @DeletedCount INT;

-- Count records before deletion
SELECT @DeletedCount = COUNT(*)
FROM CookieConsents
WHERE LastUpdated < @CutoffDate;

PRINT 'Records to delete: ' + CAST(@DeletedCount AS VARCHAR);

-- Log deletion BEFORE deleting (critical for audit trail)
INSERT INTO DataDeletionLogs (
    UserId, DataCategory, Description, RecordCount,
    DeletionMethod, Reason, LegalBasis, DeletedAt, DeletedBy, IsReversible
)
VALUES (
    'bulk-deletion',
    'cookie_consent',
    'Expired cookie consents older than ' + CONVERT(VARCHAR, @CutoffDate),
    @DeletedCount,
    'Delete',
    'Retention policy expiration',
    'Consent withdrawal - GDPR Article 7(3)',
    GETUTCDATE(),
    'REPLACE_WITH_YOUR_ADMIN_ID', -- <<< UPDATE THIS
    0 -- Not reversible
);

-- Delete records
DELETE FROM CookieConsents
WHERE LastUpdated < @CutoffDate;

PRINT 'Deleted ' + CAST(@@ROWCOUNT AS VARCHAR) + ' cookie consent records';

COMMIT TRANSACTION;
```

### Policy 2: Audit Logs (36 months retention)

**Retention Period:** 36 months (3 years)
**Action:** Delete
**Run:** Quarterly

```sql
BEGIN TRANSACTION;

DECLARE @AuditCutoffDate DATETIMEOFFSET = DATEADD(MONTH, -36, GETUTCDATE());
DECLARE @AuditDeletedCount INT;

-- Count records before deletion
SELECT @AuditDeletedCount = COUNT(*)
FROM DataSubjectRequestHistories
WHERE PerformedAt < @AuditCutoffDate;

PRINT 'Audit log entries to delete: ' + CAST(@AuditDeletedCount AS VARCHAR);

-- Log deletion
INSERT INTO DataDeletionLogs (
    UserId, DataCategory, Description, RecordCount,
    DeletionMethod, Reason, LegalBasis, DeletedAt, DeletedBy, IsReversible
)
VALUES (
    'system',
    'audit_logs',
    'Audit log entries older than ' + CONVERT(VARCHAR, @AuditCutoffDate),
    @AuditDeletedCount,
    'Delete',
    'Retention policy - audit log rotation',
    'Storage limitation - GDPR Article 5(1)(e)',
    GETUTCDATE(),
    'REPLACE_WITH_YOUR_ADMIN_ID', -- <<< UPDATE THIS
    0
);

-- Delete old audit logs
DELETE FROM DataSubjectRequestHistories
WHERE PerformedAt < @AuditCutoffDate;

PRINT 'Deleted ' + CAST(@@ROWCOUNT AS VARCHAR) + ' audit log entries';

COMMIT TRANSACTION;
```

### Policy 3: Privacy Policy Acceptances (36 months retention)

**Retention Period:** 36 months
**Action:** Archive (or Delete if no archival system)
**Run:** Quarterly

```sql
BEGIN TRANSACTION;

DECLARE @PrivacyCutoffDate DATETIMEOFFSET = DATEADD(MONTH, -36, GETUTCDATE());
DECLARE @PrivacyCount INT;

-- Check for legal holds on specific users
-- If a user is under hold, we'll skip their records
SELECT @PrivacyCount = COUNT(*)
FROM PrivacyPolicyAcceptances ppa
WHERE ppa.AcceptedAt < @PrivacyCutoffDate
  AND NOT EXISTS (
      SELECT 1 FROM LegalHolds lh
      WHERE lh.UserId = ppa.UserId
        AND lh.IsActive = 1
  );

PRINT 'Privacy acceptances to delete: ' + CAST(@PrivacyCount AS VARCHAR);

-- Log deletion
INSERT INTO DataDeletionLogs (
    UserId, DataCategory, Description, RecordCount,
    DeletionMethod, Reason, LegalBasis, DeletedAt, DeletedBy, IsReversible
)
VALUES (
    'bulk-deletion',
    'privacy_acceptances',
    'Privacy acceptances older than ' + CONVERT(VARCHAR, @PrivacyCutoffDate),
    @PrivacyCount,
    'Delete',
    'Retention policy - archived acceptance records',
    'Storage limitation - GDPR Article 5(1)(e)',
    GETUTCDATE(),
    'REPLACE_WITH_YOUR_ADMIN_ID', -- <<< UPDATE THIS
    0
);

-- Delete old privacy acceptances (skip users under legal hold)
DELETE FROM PrivacyPolicyAcceptances
WHERE AcceptedAt < @PrivacyCutoffDate
  AND NOT EXISTS (
      SELECT 1 FROM LegalHolds lh
      WHERE lh.UserId = PrivacyPolicyAcceptances.UserId
        AND lh.IsActive = 1
  );

PRINT 'Deleted ' + CAST(@@ROWCOUNT AS VARCHAR) + ' privacy acceptance records';

COMMIT TRANSACTION;
```

---

## Advanced Scripts (Use with Caution)

### Policy 4: Inactive User Accounts (24 months inactive)

**WARNING:** This deletes user accounts. Verify thoroughly before running.

**Retention Period:** 24 months of inactivity
**Action:** Delete
**Run:** Quarterly with extreme caution

```sql
BEGIN TRANSACTION;

DECLARE @InactiveCutoffDate DATETIMEOFFSET = DATEADD(MONTH, -24, GETUTCDATE());

-- Find inactive users NOT under legal hold
DECLARE @UsersToDelete TABLE (UserId NVARCHAR(255), Email NVARCHAR(255));

INSERT INTO @UsersToDelete
SELECT u.Id, u.Email
FROM Users u
WHERE u.UpdatedAt < @InactiveCutoffDate
  AND u.IsActive = 0
  AND NOT EXISTS (
      SELECT 1 FROM LegalHolds lh
      WHERE lh.UserId = u.Id AND lh.IsActive = 1
  );

-- Display users to be deleted for verification
PRINT 'Users to be deleted:';
SELECT * FROM @UsersToDelete;

-- PAUSE HERE: Review the list above before proceeding
-- Uncomment the following lines ONLY after verification:

/*
-- Log each user deletion
INSERT INTO DataDeletionLogs (
    UserId, DataCategory, Description, RecordCount,
    DeletionMethod, Reason, LegalBasis, DeletedAt, DeletedBy, IsReversible
)
SELECT
    UserId,
    'inactive_accounts',
    'Inactive user account: ' + Email,
    1,
    'Delete',
    'Retention policy - inactive account',
    'Storage limitation - GDPR Article 5(1)(e)',
    GETUTCDATE(),
    'REPLACE_WITH_YOUR_ADMIN_ID', -- <<< UPDATE THIS
    0
FROM @UsersToDelete;

-- Delete users
DELETE FROM Users
WHERE Id IN (SELECT UserId FROM @UsersToDelete);

PRINT 'Deleted ' + CAST(@@ROWCOUNT AS VARCHAR) + ' inactive user accounts';
*/

COMMIT TRANSACTION;
```

---

## Execution Workflow

### Recommended Quarterly Process:

1. **Preparation (10 minutes)**
   - Backup database
   - Review active legal holds (Utility Script #1)
   - Review pending data subject requests
   - Document start time and admin user ID

2. **Execution (20-30 minutes)**
   - Run Policy 1: Cookie Consents
   - Run Policy 2: Audit Logs
   - Run Policy 3: Privacy Acceptances
   - Run Policy 4: Inactive Accounts (optional, with caution)

3. **Verification (10 minutes)**
   - Generate deletion summary (Utility Script #3)
   - Verify deletion counts match expectations
   - Check that legal hold users were skipped
   - Test critical system functions

4. **Documentation (10 minutes)**
   - Export deletion summary to file
   - Fill out execution checklist
   - Note any issues or anomalies
   - Store records in compliance folder

---

## Troubleshooting

### Error: "Legal holds exist"

**Solution:** Review active legal holds and either:
- Release holds that are no longer needed
- Manually exclude those users from deletion queries

### Error: "Transaction deadlock"

**Solution:**
- Retry the script
- Run during low-traffic hours
- Break large deletions into smaller batches

### Error: "Foreign key constraint violation"

**Solution:**
- Check for related data in child tables
- Update script to handle cascading deletes
- Consult database schema documentation

### Zero records deleted

**Possible reasons:**
- All data is within retention period (normal for new systems)
- Broad legal holds are protecting all data
- LastUpdated/AcceptedAt fields not populated correctly

---

## Security Notes

### Access Control

- Only authorized admins should have access to this document
- SQL scripts should be run using admin database credentials
- All executions must be logged in DataDeletionLogs table

### Audit Requirements

- Never delete data without creating audit log entry
- Audit logs themselves must be retained for 7 years
- Document all retention executions in compliance folder

### Data Integrity

- Always run within transactions (BEGIN/COMMIT)
- Test queries on dev database first
- Verify backup before execution
- Never skip legal hold checks

---

## Customization Guide

### Adding a New Retention Policy

1. Create the policy in DataRetentionSchedules table
2. Write SQL script following the template above
3. Test on development database
4. Add to this document
5. Update SOP document
6. Train admin staff

### Script Template

```sql
BEGIN TRANSACTION;

-- 1. Check legal holds
DECLARE @HasLegalHolds INT;
SELECT @HasLegalHolds = COUNT(*)
FROM LegalHolds
WHERE IsActive = 1 AND (DataCategory = 'YOUR_CATEGORY' OR DataCategory IS NULL);

IF @HasLegalHolds > 0
BEGIN
    PRINT 'WARNING: Legal holds exist. Review before proceeding.';
    ROLLBACK;
    RETURN;
END

-- 2. Define cutoff date based on retention period
DECLARE @CutoffDate DATETIMEOFFSET = DATEADD(MONTH, -[RETENTION_MONTHS], GETUTCDATE());
DECLARE @DeletedCount INT;

-- 3. Count records
SELECT @DeletedCount = COUNT(*)
FROM [YOUR_TABLE]
WHERE [DATE_COLUMN] < @CutoffDate;

-- 4. Log deletion BEFORE deleting
INSERT INTO DataDeletionLogs (
    UserId, DataCategory, Description, RecordCount,
    DeletionMethod, Reason, LegalBasis, DeletedAt, DeletedBy, IsReversible
)
VALUES (
    'bulk-deletion',
    '[YOUR_CATEGORY]',
    '[YOUR_DESCRIPTION]',
    @DeletedCount,
    'Delete', -- or 'Anonymize' or 'Archive'
    '[YOUR_REASON]',
    '[YOUR_LEGAL_BASIS]',
    GETUTCDATE(),
    'REPLACE_WITH_YOUR_ADMIN_ID',
    0
);

-- 5. Delete records
DELETE FROM [YOUR_TABLE]
WHERE [DATE_COLUMN] < @CutoffDate;

PRINT 'Deleted ' + CAST(@@ROWCOUNT AS VARCHAR) + ' records';

COMMIT TRANSACTION;
```

---

## Compliance Checklist

After each quarterly execution:

- [ ] All scripts executed successfully
- [ ] Audit logs created for all deletions
- [ ] Legal holds were checked and respected
- [ ] Deletion counts documented
- [ ] Backup verified and stored
- [ ] System functionality tested
- [ ] Execution report signed and filed
- [ ] Next execution scheduled (3 months)

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-17 | System | Initial SQL script library |

---

## Support

For questions or issues with these scripts:
- Technical issues: Database Administrator / Development Team
- Policy questions: Data Protection Officer
- Legal holds: Legal Department
- GDPR compliance: Compliance Team
