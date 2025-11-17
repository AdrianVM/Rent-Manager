# Data Retention Standard Operating Procedure (SOP)

## Overview

This document describes the manual process for executing data retention policies on a quarterly basis. The Rent Manager system implements GDPR-compliant data retention through admin-initiated execution rather than automated background jobs.

## Execution Schedule

**Frequency:** Quarterly (every 3 months)

**Recommended Schedule:**
- Q1: End of March
- Q2: End of June
- Q3: End of September
- Q4: End of December

**Time Required:** Approximately 30-60 minutes per execution

---

## Prerequisites

### Access Requirements
- Admin role in the Rent Manager system
- Access to the Privacy Compliance page (`/privacy-compliance`)
- Access to the backend API (for dry run testing)

### Before You Begin
1. Ensure you have a recent database backup
2. Review any active Legal Holds that may prevent deletion
3. Check for any pending Data Subject Requests that might be affected
4. Notify relevant stakeholders about the upcoming retention execution

---

## Execution Process

### Step 1: Review Active Retention Policies

1. Navigate to **Privacy Compliance** in the admin dashboard
2. Review the current retention policies displayed on the page
3. Verify that all policies are up-to-date and compliant with current regulations

**Current Default Policies:**
- **User Accounts:** Retained while account is active
- **Payment Records:** 7 years (84 months) - Legal requirement
- **Tenant Contracts:** 7 years (84 months) - Legal requirement
- **Maintenance Records:** 3 years (36 months) - Business need
- **System Audit Logs:** 2 years (24 months) - Security compliance
- **Property Viewing History:** 1 year (12 months) - Business analytics
- **Communication Logs:** 1 year (12 months) - Compliance

### Step 2: Check Legal Holds

1. Navigate to **Legal Holds Manager** (if available in sidebar)
2. Review all active legal holds
3. Document any users or data categories under legal hold

**Important:** Data subject to legal holds will NOT be deleted even if retention period has expired.

### Step 3: Perform a Dry Run (Recommended)

Before executing actual deletion, perform a dry run to preview what will be affected:

**Using Swagger/API:**

1. Navigate to `/swagger` endpoint
2. Find `POST /api/dataretention/execute-preview` (dry run endpoint)
3. Execute with authentication token
4. Review the response:
   - Number of records to be deleted
   - Number of records to be anonymized
   - Number of records to be archived
   - Affected data categories

**Expected Response Format:**
```json
{
  "totalRecordsDeleted": 0,
  "totalRecordsAnonymized": 0,
  "totalRecordsArchived": 0,
  "executedPolicies": [
    {
      "dataCategory": "PropertyViewingHistory",
      "recordsProcessed": 15,
      "errors": []
    }
  ],
  "executedAt": "2025-11-17T10:30:00Z",
  "executedBy": "admin@example.com"
}
```

### Step 4: Review Dry Run Results

1. Examine the number of records affected in each category
2. Verify the numbers are reasonable based on system usage
3. Investigate any unexpected large deletions
4. If results look suspicious, STOP and investigate before proceeding

**Red Flags:**
- Unexpectedly high number of deletions (thousands when expecting dozens)
- Critical data categories being affected (e.g., active user accounts)
- Errors in the dry run response

### Step 5: Execute Retention Policies

Once you've verified the dry run results are acceptable:

**Using Swagger/API:**

1. Navigate to `/swagger` endpoint
2. Find `POST /api/dataretention/execute` endpoint
3. Execute with authentication token
4. Monitor the response for completion

**This action will:**
- **Delete** records past retention in categories configured for deletion
- **Anonymize** personally identifiable information in categories configured for anonymization
- **Archive** records in categories configured for archiving

**Important:** This action is irreversible for deletions. Ensure you have a backup.

### Step 6: Verify Execution Results

After execution completes:

1. Review the execution response
2. Check for any errors in the response
3. Verify the numbers match the dry run (within reasonable variance)
4. Check database audit logs for execution records

**Execution Response Fields:**
- `totalRecordsDeleted`: Number of records permanently deleted
- `totalRecordsAnonymized`: Number of records anonymized
- `totalRecordsArchived`: Number of records archived
- `executedPolicies`: Breakdown by data category
- `executedAt`: Timestamp of execution
- `executedBy`: Admin user who initiated execution

### Step 7: Document Execution

Create an execution record documenting:

1. **Date and time** of execution
2. **Admin user** who performed execution
3. **Dry run results** (number of records affected)
4. **Actual execution results** (number of records processed)
5. **Any errors or issues** encountered
6. **Actions taken** to resolve issues
7. **Database backup** reference/timestamp

**Template:**

```
Data Retention Execution Report
================================
Date: YYYY-MM-DD HH:MM UTC
Executed By: [Admin Email]
Quarter: Q[1-4] YYYY

Dry Run Results:
- Records to Delete: [number]
- Records to Anonymize: [number]
- Records to Archive: [number]

Actual Execution Results:
- Records Deleted: [number]
- Records Anonymized: [number]
- Records Archived: [number]

Policies Executed:
- [Data Category 1]: [count] records
- [Data Category 2]: [count] records
- ...

Errors: [None / Description of errors]
Issues Encountered: [None / Description]
Actions Taken: [Description of any corrective actions]
Database Backup: [Backup timestamp/reference]

Sign-off: [Admin Name]
```

### Step 8: Post-Execution Verification

1. **Test critical system functions** to ensure no unintended data was deleted
2. **Check user access** - verify active users can still log in and access their data
3. **Review audit logs** - confirm execution was logged correctly
4. **Monitor system** for 24-48 hours for any user reports of missing data

---

## Handling Legal Holds

### What is a Legal Hold?

A legal hold prevents data deletion when data is subject to legal proceedings, investigations, or litigation. Data under legal hold is retained regardless of retention policies.

### Before Execution

1. Navigate to **Legal Holds Manager**
2. Review all active holds
3. Document users and categories affected
4. Verify holds are still necessary (contact legal team if unsure)

### During Execution

- The system automatically skips data under legal hold
- Execution logs will note "Legal hold prevented deletion" for affected records
- No action required from admin during execution

### After Execution

1. Review execution logs for legal hold notifications
2. Verify held data was NOT deleted
3. Document which data categories were preserved due to holds

---

## Handling Data Subject Requests

### Coordination with Phase 2 Requests

Before executing retention policies:

1. Check **Data Subject Requests** page for pending requests
2. Complete or acknowledge any pending **Deletion** requests
3. Note any **Restriction** requests (processing restricted but data retained)
4. Review **RetentionInquiry** requests for user concerns

### Priority Order

1. **Legal Holds** - Highest priority, prevents all deletion
2. **Data Subject Deletion Requests** - Manual admin review required
3. **Retention Policies** - Automated quarterly execution

### Conflicts

If a retention policy would delete data for a user with pending requests:

1. Review the request type and status
2. If request is **Access** or **Portability**: Complete the request BEFORE executing retention
3. If request is **Deletion**: Retention execution may fulfill the request - document this
4. If request is **Restriction**: Skip the user in retention execution
5. If request is **Objection**: Consult legal before proceeding

---

## Troubleshooting

### Error: "Legal hold check failed"

**Cause:** Unable to verify legal hold status
**Action:**
1. Check legal holds database table connectivity
2. Review legal holds service logs
3. Do NOT proceed with execution until resolved

### Error: "Transaction failed"

**Cause:** Database transaction rollback
**Action:**
1. Check database connection and status
2. Review database logs for constraint violations
3. Verify database has sufficient resources (disk space, memory)
4. Retry execution after resolving database issues

### Error: "Audit log write failed"

**Cause:** Unable to write audit trail
**Action:**
1. Check audit log table status
2. Verify database write permissions
3. DO NOT proceed - audit trail is required for compliance

### Unexpected High Deletion Count

**Cause:** Policy misconfiguration or data anomaly
**Action:**
1. STOP execution immediately
2. Review retention policy configuration
3. Check for bulk data imports or unusual system activity
4. Investigate specific data categories with high counts
5. Consult with development team before proceeding

### No Records Processed

**Cause:** All data is within retention period or under legal hold
**Action:**
1. This may be normal if system is new or data is recent
2. Verify retention policies are configured correctly
3. Check that `LastModifiedDate` fields are populated
4. Review legal hold coverage - ensure it's not too broad

---

## Compliance Notes

### GDPR Requirements

- **Article 5(1)(e):** Storage limitation - data kept no longer than necessary
- **Article 17:** Right to erasure - users can request deletion
- **Article 30:** Records of processing - audit logs required

### Audit Trail

Every retention execution is logged with:
- Timestamp of execution
- Admin user who initiated execution
- Number of records affected per category
- Any errors or warnings
- Legal hold interactions

### Record Retention

Maintain execution reports for **7 years** for compliance purposes:
- Quarterly execution reports
- Dry run results
- Database backup references
- Any incident reports

---

## Contact and Escalation

### For Questions About:

- **Retention Policies:** System Administrator / Data Protection Officer
- **Legal Holds:** Legal Department / General Counsel
- **Technical Issues:** Development Team / Database Administrator
- **User Inquiries:** Use "Contact Us" form on Privacy Compliance page

### Escalation Path

1. **Level 1:** System Administrator (routine execution)
2. **Level 2:** Data Protection Officer (policy questions)
3. **Level 3:** Legal Department (legal hold or compliance issues)
4. **Level 4:** Executive Management (significant data incidents)

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-17 | System | Initial SOP for manual retention execution |

---

## Approval

This SOP should be reviewed and approved by:

- [ ] System Administrator
- [ ] Data Protection Officer
- [ ] Legal Department
- [ ] Executive Management

**Next Review Date:** [Set for 6 months from approval]

---

## Appendix: Quick Reference Checklist

**Pre-Execution:**
- [ ] Database backup completed
- [ ] Legal holds reviewed
- [ ] Pending data subject requests reviewed
- [ ] Stakeholders notified

**Execution:**
- [ ] Dry run performed
- [ ] Dry run results reviewed and approved
- [ ] Actual execution completed
- [ ] Execution results verified

**Post-Execution:**
- [ ] Execution report documented
- [ ] Audit logs verified
- [ ] System functionality tested
- [ ] Users can access their data
- [ ] 24-48 hour monitoring period complete

**Documentation:**
- [ ] Execution report filed
- [ ] Backup reference recorded
- [ ] Any incidents documented
- [ ] Next execution scheduled
