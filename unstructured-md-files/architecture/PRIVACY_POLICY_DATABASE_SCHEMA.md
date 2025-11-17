# Privacy Policy Database Schema - Comprehensive Design

## Overview

This document provides a complete database schema design for privacy policy management, GDPR compliance, and data subject rights handling in the Rent Manager application. The schema is designed to provide comprehensive audit trails, version control, and compliance tracking.

## Design Principles

1. **Complete Audit Trail**: Every action is logged with timestamps, IP addresses, and user agents
2. **Version Control**: Privacy policies are versioned with full history
3. **GDPR Compliance**: Structured support for all data subject rights (Articles 15-22)
4. **Retention Management**: Documented retention policies with automated enforcement
5. **Consent Tracking**: Granular consent management for communications
6. **Proof of Compliance**: Demonstrable compliance for regulatory audits

---

## Entity Relationship Overview

```
PrivacyPolicyVersion
    ├─── UserPrivacyPolicyAcceptance (1:many)

DataSubjectRequest
    ├─── DataSubjectRequestHistory (1:many)
    └─── DataDeletionLog (1:many via reference)

CommunicationPreferences
    └─── CommunicationConsentHistory (1:many)

DataRetentionSchedule (standalone configuration)

DataDeletionLog (audit log, standalone)
```

---

## Table Schemas

### 1. PrivacyPolicyVersion

Stores different versions of your privacy policy over time.

**Purpose**:
- Track complete version history
- Store both HTML (web) and plain text (email) versions
- Distinguish minor updates from material changes requiring re-acceptance
- Record who published each version for accountability

**Schema**:

```csharp
public class PrivacyPolicyVersion
{
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// Version number (e.g., "1.0", "1.1", "2.0")
    /// </summary>
    [Required]
    [MaxLength(10)]
    public string Version { get; set; } = string.Empty;

    /// <summary>
    /// Full HTML content of the privacy policy
    /// </summary>
    [Required]
    public string ContentHtml { get; set; } = string.Empty;

    /// <summary>
    /// Plain text version for email notifications
    /// </summary>
    public string? ContentPlainText { get; set; }

    /// <summary>
    /// When this version becomes effective
    /// </summary>
    [Required]
    public DateTimeOffset EffectiveDate { get; set; }

    /// <summary>
    /// When this version was created in the system
    /// </summary>
    [Required]
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// User ID who created/published this version
    /// </summary>
    public string? CreatedBy { get; set; }

    /// <summary>
    /// Is this the currently active version?
    /// </summary>
    [Required]
    public bool IsCurrent { get; set; } = false;

    /// <summary>
    /// Is this a material change requiring re-acceptance?
    /// </summary>
    [Required]
    public bool RequiresReAcceptance { get; set; } = false;

    /// <summary>
    /// Summary of changes from previous version
    /// </summary>
    [MaxLength(2000)]
    public string? ChangesSummary { get; set; }

    /// <summary>
    /// Navigation property to user acceptances
    /// </summary>
    public virtual ICollection<UserPrivacyPolicyAcceptance> UserAcceptances { get; set; }
        = new List<UserPrivacyPolicyAcceptance>();
}
```

**Indexes**:
- Unique index on `Version`
- Index on `IsCurrent`
- Index on `EffectiveDate`

**EF Core Configuration**:

```csharp
modelBuilder.Entity<PrivacyPolicyVersion>(entity =>
{
    entity.ToTable("privacy_policy_versions");
    entity.HasKey(e => e.Id);
    entity.HasIndex(e => e.Version).IsUnique();
    entity.HasIndex(e => e.IsCurrent);
    entity.HasIndex(e => e.EffectiveDate);

    entity.Property(e => e.Version).IsRequired().HasMaxLength(10);
    entity.Property(e => e.ContentHtml).IsRequired();
    entity.Property(e => e.EffectiveDate).IsRequired();
    entity.Property(e => e.CreatedAt).IsRequired();
    entity.Property(e => e.IsCurrent).IsRequired();
    entity.Property(e => e.RequiresReAcceptance).IsRequired();
    entity.Property(e => e.CreatedBy).HasMaxLength(255);
    entity.Property(e => e.ChangesSummary).HasMaxLength(2000);
});
```

---

### 2. UserPrivacyPolicyAcceptance

Tracks when users accept each privacy policy version.

**Purpose**:
- Full audit trail (who, when, where, how)
- Links to specific policy version
- Tracks acceptance method (registration vs. forced re-acceptance)
- **GDPR Article 7(1)**: Requires proof of consent

**Schema**:

```csharp
public class UserPrivacyPolicyAcceptance
{
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// User ID who accepted the policy
    /// </summary>
    [Required]
    [MaxLength(255)]
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// Foreign key to privacy policy version
    /// </summary>
    [Required]
    public int PolicyVersionId { get; set; }

    /// <summary>
    /// Navigation property to policy version
    /// </summary>
    public virtual PrivacyPolicyVersion PolicyVersion { get; set; } = null!;

    /// <summary>
    /// When the user accepted this version
    /// </summary>
    [Required]
    public DateTimeOffset AcceptedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// IP address when acceptance occurred (audit trail)
    /// </summary>
    [MaxLength(45)] // IPv6 max length
    public string? IpAddress { get; set; }

    /// <summary>
    /// User agent when acceptance occurred (audit trail)
    /// </summary>
    [MaxLength(500)]
    public string? UserAgent { get; set; }

    /// <summary>
    /// How the user accepted (e.g., "registration", "update_notification", "explicit_request")
    /// </summary>
    [MaxLength(50)]
    public string? AcceptanceMethod { get; set; }

    /// <summary>
    /// Optional: If user was shown a summary of changes
    /// </summary>
    public bool WasShownChangesSummary { get; set; } = false;
}
```

**Indexes**:
- Index on `UserId`
- Index on `PolicyVersionId`
- Composite index on `(UserId, PolicyVersionId)`

**EF Core Configuration**:

```csharp
modelBuilder.Entity<UserPrivacyPolicyAcceptance>(entity =>
{
    entity.ToTable("user_privacy_policy_acceptances");
    entity.HasKey(e => e.Id);
    entity.HasIndex(e => e.UserId);
    entity.HasIndex(e => e.PolicyVersionId);
    entity.HasIndex(e => new { e.UserId, e.PolicyVersionId });

    entity.Property(e => e.UserId).IsRequired().HasMaxLength(255);
    entity.Property(e => e.AcceptedAt).IsRequired();
    entity.Property(e => e.IpAddress).HasMaxLength(45);
    entity.Property(e => e.UserAgent).HasMaxLength(500);
    entity.Property(e => e.AcceptanceMethod).HasMaxLength(50);

    entity.HasOne(e => e.PolicyVersion)
        .WithMany(pv => pv.UserAcceptances)
        .HasForeignKey(e => e.PolicyVersionId)
        .OnDelete(DeleteBehavior.Restrict); // Don't delete version if acceptances exist
});
```

---

### 3. DataSubjectRequest

Tracks all GDPR data subject rights requests (access, deletion, portability, etc.).

**Purpose**:
- Structured workflow for data subject requests
- Deadline tracking (GDPR: 1 month, extendable to 3)
- Identity verification tracking
- Request history audit log
- **GDPR Articles 15-22**: All data subject rights

**Schema**:

```csharp
public class DataSubjectRequest
{
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// Unique ticket number for tracking (e.g., "DSR-2025-00123")
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string RequestNumber { get; set; } = string.Empty;

    /// <summary>
    /// User ID making the request (optional for non-users)
    /// </summary>
    [MaxLength(255)]
    public string? UserId { get; set; }

    /// <summary>
    /// Email address (required for non-authenticated requests)
    /// </summary>
    [Required]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Type of request
    /// </summary>
    [Required]
    public DataSubjectRequestType RequestType { get; set; }

    /// <summary>
    /// Current status of the request
    /// </summary>
    [Required]
    public DataSubjectRequestStatus Status { get; set; } = DataSubjectRequestStatus.Pending;

    /// <summary>
    /// When the request was submitted
    /// </summary>
    [Required]
    public DateTimeOffset SubmittedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// Deadline to respond (GDPR: 1 month, extendable to 3)
    /// </summary>
    [Required]
    public DateTimeOffset DueDate { get; set; }

    /// <summary>
    /// When the request was completed
    /// </summary>
    public DateTimeOffset? CompletedAt { get; set; }

    /// <summary>
    /// IP address when request was submitted
    /// </summary>
    [MaxLength(45)]
    public string? IpAddress { get; set; }

    /// <summary>
    /// User agent when request was submitted
    /// </summary>
    [MaxLength(500)]
    public string? UserAgent { get; set; }

    /// <summary>
    /// User's description/details of their request
    /// </summary>
    [MaxLength(2000)]
    public string? RequestDetails { get; set; }

    /// <summary>
    /// Admin notes (internal only, not shared with user)
    /// </summary>
    [MaxLength(2000)]
    public string? InternalNotes { get; set; }

    /// <summary>
    /// Response sent to the user
    /// </summary>
    public string? ResponseText { get; set; }

    /// <summary>
    /// User ID who handled/processed this request
    /// </summary>
    [MaxLength(255)]
    public string? ProcessedBy { get; set; }

    /// <summary>
    /// For data export requests: path to exported data file
    /// </summary>
    [MaxLength(500)]
    public string? ExportFilePath { get; set; }

    /// <summary>
    /// Was identity verification completed?
    /// </summary>
    public bool IdentityVerified { get; set; } = false;

    /// <summary>
    /// Method of identity verification
    /// </summary>
    [MaxLength(100)]
    public string? VerificationMethod { get; set; }

    /// <summary>
    /// Navigation property to request history
    /// </summary>
    public virtual ICollection<DataSubjectRequestHistory> History { get; set; }
        = new List<DataSubjectRequestHistory>();
}

public enum DataSubjectRequestType
{
    Access,              // GDPR Art. 15 - Right to access
    Rectification,       // GDPR Art. 16 - Right to rectification
    Erasure,            // GDPR Art. 17 - Right to be forgotten
    Restriction,        // GDPR Art. 18 - Right to restriction
    Portability,        // GDPR Art. 20 - Right to data portability
    Objection,          // GDPR Art. 21 - Right to object
    AutomatedDecision,  // GDPR Art. 22 - Automated decision-making
    WithdrawConsent,    // GDPR Art. 7(3) - Withdraw consent
    OptOutSale          // CCPA - Opt-out of sale
}

public enum DataSubjectRequestStatus
{
    Pending,            // Just submitted, awaiting review
    UnderReview,        // Being reviewed by team
    AwaitingVerification, // Waiting for identity verification
    InProgress,         // Actively being processed
    Completed,          // Successfully completed
    Rejected,           // Rejected (with explanation)
    Extended,           // Timeline extended (complex request)
    Cancelled           // User cancelled request
}
```

**Indexes**:
- Unique index on `RequestNumber`
- Index on `UserId`
- Index on `Email`
- Index on `Status`
- Index on `DueDate`

**EF Core Configuration**:

```csharp
modelBuilder.Entity<DataSubjectRequest>(entity =>
{
    entity.ToTable("data_subject_requests");
    entity.HasKey(e => e.Id);
    entity.HasIndex(e => e.RequestNumber).IsUnique();
    entity.HasIndex(e => e.UserId);
    entity.HasIndex(e => e.Email);
    entity.HasIndex(e => e.Status);
    entity.HasIndex(e => e.DueDate);

    entity.Property(e => e.RequestNumber).IsRequired().HasMaxLength(50);
    entity.Property(e => e.UserId).HasMaxLength(255);
    entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
    entity.Property(e => e.RequestType).HasConversion<string>().IsRequired();
    entity.Property(e => e.Status).HasConversion<string>().IsRequired();
    entity.Property(e => e.SubmittedAt).IsRequired();
    entity.Property(e => e.DueDate).IsRequired();
    entity.Property(e => e.IpAddress).HasMaxLength(45);
    entity.Property(e => e.UserAgent).HasMaxLength(500);
    entity.Property(e => e.RequestDetails).HasMaxLength(2000);
    entity.Property(e => e.InternalNotes).HasMaxLength(2000);
    entity.Property(e => e.ProcessedBy).HasMaxLength(255);
    entity.Property(e => e.ExportFilePath).HasMaxLength(500);
    entity.Property(e => e.VerificationMethod).HasMaxLength(100);
});
```

---

### 4. DataSubjectRequestHistory

Audit log of all actions taken on a data subject request.

**Purpose**:
- Complete audit trail of all actions
- Tracks who did what and when
- Demonstrates compliance for regulators

**Schema**:

```csharp
public class DataSubjectRequestHistory
{
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// Foreign key to parent request
    /// </summary>
    [Required]
    public int DataSubjectRequestId { get; set; }

    /// <summary>
    /// Navigation property
    /// </summary>
    public virtual DataSubjectRequest DataSubjectRequest { get; set; } = null!;

    /// <summary>
    /// When this action occurred
    /// </summary>
    [Required]
    public DateTimeOffset OccurredAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// User who performed this action
    /// </summary>
    [MaxLength(255)]
    public string? PerformedBy { get; set; }

    /// <summary>
    /// Type of action (e.g., "status_changed", "note_added", "email_sent")
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string Action { get; set; } = string.Empty;

    /// <summary>
    /// Previous status (if status change)
    /// </summary>
    public DataSubjectRequestStatus? OldStatus { get; set; }

    /// <summary>
    /// New status (if status change)
    /// </summary>
    public DataSubjectRequestStatus? NewStatus { get; set; }

    /// <summary>
    /// Description of what was done
    /// </summary>
    [MaxLength(1000)]
    public string? Description { get; set; }
}
```

**Indexes**:
- Index on `DataSubjectRequestId`
- Index on `OccurredAt`

**EF Core Configuration**:

```csharp
modelBuilder.Entity<DataSubjectRequestHistory>(entity =>
{
    entity.ToTable("data_subject_request_histories");
    entity.HasKey(e => e.Id);
    entity.HasIndex(e => e.DataSubjectRequestId);
    entity.HasIndex(e => e.OccurredAt);

    entity.Property(e => e.OccurredAt).IsRequired();
    entity.Property(e => e.PerformedBy).HasMaxLength(255);
    entity.Property(e => e.Action).IsRequired().HasMaxLength(100);
    entity.Property(e => e.OldStatus).HasConversion<string>();
    entity.Property(e => e.NewStatus).HasConversion<string>();
    entity.Property(e => e.Description).HasMaxLength(1000);

    entity.HasOne(e => e.DataSubjectRequest)
        .WithMany(dsr => dsr.History)
        .HasForeignKey(e => e.DataSubjectRequestId)
        .OnDelete(DeleteBehavior.Cascade);
});
```

---

### 5. DataRetentionSchedule

Defines retention policies for different data categories.

**Purpose**:
- Documents your retention policies
- Provides legal justification
- Tracks when policies were reviewed
- Guides automated deletion jobs

**Schema**:

```csharp
public class DataRetentionSchedule
{
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// Category of data (e.g., "user_accounts", "financial_records", "contracts")
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string DataCategory { get; set; } = string.Empty;

    /// <summary>
    /// Human-readable description
    /// </summary>
    [Required]
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Retention period in months
    /// </summary>
    [Required]
    public int RetentionMonths { get; set; }

    /// <summary>
    /// Legal basis for retention (e.g., "Tax compliance", "Contract fulfillment")
    /// </summary>
    [Required]
    [MaxLength(500)]
    public string LegalBasis { get; set; } = string.Empty;

    /// <summary>
    /// What happens after retention period (Delete, Anonymize, Archive)
    /// </summary>
    [Required]
    public RetentionAction Action { get; set; }

    /// <summary>
    /// Is this policy currently active?
    /// </summary>
    [Required]
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// When this policy was created
    /// </summary>
    [Required]
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// Last time this policy was reviewed
    /// </summary>
    public DateTimeOffset? LastReviewedAt { get; set; }

    /// <summary>
    /// Who last reviewed this policy
    /// </summary>
    [MaxLength(255)]
    public string? ReviewedBy { get; set; }
}

public enum RetentionAction
{
    Delete,      // Permanent deletion
    Anonymize,   // Remove PII, keep statistical data
    Archive      // Move to cold storage
}
```

**Indexes**:
- Index on `DataCategory`
- Index on `IsActive`

**EF Core Configuration**:

```csharp
modelBuilder.Entity<DataRetentionSchedule>(entity =>
{
    entity.ToTable("data_retention_schedules");
    entity.HasKey(e => e.Id);
    entity.HasIndex(e => e.DataCategory);
    entity.HasIndex(e => e.IsActive);

    entity.Property(e => e.DataCategory).IsRequired().HasMaxLength(100);
    entity.Property(e => e.Description).IsRequired().HasMaxLength(500);
    entity.Property(e => e.RetentionMonths).IsRequired();
    entity.Property(e => e.LegalBasis).IsRequired().HasMaxLength(500);
    entity.Property(e => e.Action).HasConversion<string>().IsRequired();
    entity.Property(e => e.IsActive).IsRequired();
    entity.Property(e => e.CreatedAt).IsRequired();
    entity.Property(e => e.ReviewedBy).HasMaxLength(255);
});
```

**Example Seed Data**:

```csharp
// In OnModelCreating
entity.HasData(
    new DataRetentionSchedule
    {
        Id = 1,
        DataCategory = "financial_records",
        Description = "Payment records, invoices, and financial transactions",
        RetentionMonths = 84, // 7 years
        LegalBasis = "Tax compliance requirements (IRS/HMRC 7-year retention)",
        Action = RetentionAction.Archive,
        IsActive = true,
        CreatedAt = new DateTimeOffset(2025, 1, 1, 0, 0, 0, TimeSpan.Zero)
    },
    new DataRetentionSchedule
    {
        Id = 2,
        DataCategory = "user_accounts_active",
        Description = "Active user account data",
        RetentionMonths = 0, // Retained while active
        LegalBasis = "Contract fulfillment (GDPR Art. 6.1.b)",
        Action = RetentionAction.Delete,
        IsActive = true,
        CreatedAt = new DateTimeOffset(2025, 1, 1, 0, 0, 0, TimeSpan.Zero)
    },
    new DataRetentionSchedule
    {
        Id = 3,
        DataCategory = "user_accounts_closed",
        Description = "Closed/deleted user accounts",
        RetentionMonths = 6,
        LegalBasis = "Legitimate interest - dispute resolution and fraud prevention",
        Action = RetentionAction.Delete,
        IsActive = true,
        CreatedAt = new DateTimeOffset(2025, 1, 1, 0, 0, 0, TimeSpan.Zero)
    },
    new DataRetentionSchedule
    {
        Id = 4,
        DataCategory = "lease_agreements",
        Description = "Lease contracts and related documentation",
        RetentionMonths = 84, // 7 years after lease ends
        LegalBasis = "Legal obligation - contract law and tax compliance",
        Action = RetentionAction.Archive,
        IsActive = true,
        CreatedAt = new DateTimeOffset(2025, 1, 1, 0, 0, 0, TimeSpan.Zero)
    },
    new DataRetentionSchedule
    {
        Id = 5,
        DataCategory = "email_notifications",
        Description = "Sent email notifications (rent reminders, lease warnings)",
        RetentionMonths = 24, // 2 years
        LegalBasis = "Legitimate interest - proof of notification delivery",
        Action = RetentionAction.Delete,
        IsActive = true,
        CreatedAt = new DateTimeOffset(2025, 1, 1, 0, 0, 0, TimeSpan.Zero)
    },
    new DataRetentionSchedule
    {
        Id = 6,
        DataCategory = "system_logs",
        Description = "Application and access logs",
        RetentionMonths = 3, // 90 days
        LegalBasis = "Legitimate interest - security monitoring and troubleshooting",
        Action = RetentionAction.Delete,
        IsActive = true,
        CreatedAt = new DateTimeOffset(2025, 1, 1, 0, 0, 0, TimeSpan.Zero)
    },
    new DataRetentionSchedule
    {
        Id = 7,
        DataCategory = "cookie_consent",
        Description = "Cookie consent records",
        RetentionMonths = 24, // 2 years from last interaction
        LegalBasis = "Legal obligation - GDPR proof of consent requirement",
        Action = RetentionAction.Delete,
        IsActive = true,
        CreatedAt = new DateTimeOffset(2025, 1, 1, 0, 0, 0, TimeSpan.Zero)
    }
);
```

---

### 6. DataDeletionLog

Records all data deletions for compliance proof.

**Purpose**:
- Permanent record of deletions (even after user data is gone)
- Proves compliance with deletion requests
- Tracks what was kept and why (e.g., tax records)
- Maintains audit trail for 7+ years

**Schema**:

```csharp
public class DataDeletionLog
{
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// User ID whose data was deleted
    /// </summary>
    [Required]
    [MaxLength(255)]
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// Email address (preserved after deletion for audit)
    /// </summary>
    [Required]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// When deletion occurred
    /// </summary>
    [Required]
    public DateTimeOffset DeletedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// Reason for deletion
    /// </summary>
    [Required]
    public DeletionReason Reason { get; set; }

    /// <summary>
    /// Was this triggered by user request or automatic retention policy?
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string TriggerType { get; set; } = string.Empty; // "user_request", "retention_policy", "admin_action"

    /// <summary>
    /// Reference to data subject request if applicable
    /// </summary>
    public int? DataSubjectRequestId { get; set; }

    /// <summary>
    /// Who performed the deletion
    /// </summary>
    [MaxLength(255)]
    public string? DeletedBy { get; set; }

    /// <summary>
    /// What data was deleted (categories)
    /// </summary>
    [Required]
    public string DataCategoriesDeleted { get; set; } = string.Empty; // JSON array

    /// <summary>
    /// What data was retained and why
    /// </summary>
    public string? DataRetainedReason { get; set; }

    /// <summary>
    /// Additional notes
    /// </summary>
    [MaxLength(1000)]
    public string? Notes { get; set; }
}

public enum DeletionReason
{
    UserRequest,         // User requested deletion
    AccountInactive,     // Automatic deletion due to inactivity
    RetentionPolicy,     // Automatic deletion per retention schedule
    ConsentWithdrawn,    // User withdrew consent
    LegalObligation,     // Legal requirement to delete
    AdminAction          // Manual admin deletion
}
```

**Indexes**:
- Index on `UserId`
- Index on `Email`
- Index on `DeletedAt`

**EF Core Configuration**:

```csharp
modelBuilder.Entity<DataDeletionLog>(entity =>
{
    entity.ToTable("data_deletion_logs");
    entity.HasKey(e => e.Id);
    entity.HasIndex(e => e.UserId);
    entity.HasIndex(e => e.Email);
    entity.HasIndex(e => e.DeletedAt);

    entity.Property(e => e.UserId).IsRequired().HasMaxLength(255);
    entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
    entity.Property(e => e.DeletedAt).IsRequired();
    entity.Property(e => e.Reason).HasConversion<string>().IsRequired();
    entity.Property(e => e.TriggerType).IsRequired().HasMaxLength(50);
    entity.Property(e => e.DeletedBy).HasMaxLength(255);
    entity.Property(e => e.DataCategoriesDeleted).IsRequired();
    entity.Property(e => e.Notes).HasMaxLength(1000);
});
```

---

### 7. CommunicationPreferences

Tracks user consent for different types of communications.

**Purpose**:
- Granular control over communication types
- Separates transactional (cannot opt-out) from marketing (must opt-in)
- Tracks consent changes over time
- **GDPR Article 7** compliant (specific, informed consent)

**Schema**:

```csharp
public class CommunicationPreferences
{
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// User ID
    /// </summary>
    [Required]
    [MaxLength(255)]
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// Transactional emails (cannot be disabled - rent reminders, lease notices)
    /// </summary>
    [Required]
    public bool TransactionalEmails { get; set; } = true;

    /// <summary>
    /// System notifications (account changes, security alerts)
    /// </summary>
    [Required]
    public bool SystemNotifications { get; set; } = true;

    /// <summary>
    /// Product updates and feature announcements
    /// </summary>
    [Required]
    public bool ProductUpdates { get; set; } = false;

    /// <summary>
    /// Marketing emails (offers, promotions)
    /// </summary>
    [Required]
    public bool MarketingEmails { get; set; } = false;

    /// <summary>
    /// Surveys and feedback requests
    /// </summary>
    [Required]
    public bool SurveysAndFeedback { get; set; } = false;

    /// <summary>
    /// SMS/text messages
    /// </summary>
    [Required]
    public bool SmsMessages { get; set; } = false;

    /// <summary>
    /// When preferences were last updated
    /// </summary>
    [Required]
    public DateTimeOffset LastUpdated { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// IP address when preferences were updated
    /// </summary>
    [MaxLength(45)]
    public string? IpAddress { get; set; }

    /// <summary>
    /// Navigation property to consent history
    /// </summary>
    public virtual ICollection<CommunicationConsentHistory> ConsentHistory { get; set; }
        = new List<CommunicationConsentHistory>();
}
```

**Indexes**:
- Unique index on `UserId` (one preference set per user)

**EF Core Configuration**:

```csharp
modelBuilder.Entity<CommunicationPreferences>(entity =>
{
    entity.ToTable("communication_preferences");
    entity.HasKey(e => e.Id);
    entity.HasIndex(e => e.UserId).IsUnique();

    entity.Property(e => e.UserId).IsRequired().HasMaxLength(255);
    entity.Property(e => e.TransactionalEmails).IsRequired();
    entity.Property(e => e.SystemNotifications).IsRequired();
    entity.Property(e => e.ProductUpdates).IsRequired();
    entity.Property(e => e.MarketingEmails).IsRequired();
    entity.Property(e => e.SurveysAndFeedback).IsRequired();
    entity.Property(e => e.SmsMessages).IsRequired();
    entity.Property(e => e.LastUpdated).IsRequired();
    entity.Property(e => e.IpAddress).HasMaxLength(45);
});
```

---

### 8. CommunicationConsentHistory

Audit trail for communication preference changes.

**Purpose**:
- Complete history of all consent changes
- Proves when user opted in/out
- Demonstrates GDPR compliance

**Schema**:

```csharp
public class CommunicationConsentHistory
{
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// Foreign key to communication preferences
    /// </summary>
    [Required]
    public int CommunicationPreferencesId { get; set; }

    /// <summary>
    /// Navigation property
    /// </summary>
    public virtual CommunicationPreferences CommunicationPreferences { get; set; } = null!;

    /// <summary>
    /// When this change occurred
    /// </summary>
    [Required]
    public DateTimeOffset ChangedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// Which preference was changed
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string PreferenceType { get; set; } = string.Empty;

    /// <summary>
    /// Previous value
    /// </summary>
    [Required]
    public bool OldValue { get; set; }

    /// <summary>
    /// New value
    /// </summary>
    [Required]
    public bool NewValue { get; set; }

    /// <summary>
    /// How the change was made (e.g., "user_settings", "unsubscribe_link", "registration")
    /// </summary>
    [MaxLength(50)]
    public string? ChangeMethod { get; set; }

    /// <summary>
    /// IP address
    /// </summary>
    [MaxLength(45)]
    public string? IpAddress { get; set; }
}
```

**Indexes**:
- Index on `CommunicationPreferencesId`
- Index on `ChangedAt`

**EF Core Configuration**:

```csharp
modelBuilder.Entity<CommunicationConsentHistory>(entity =>
{
    entity.ToTable("communication_consent_histories");
    entity.HasKey(e => e.Id);
    entity.HasIndex(e => e.CommunicationPreferencesId);
    entity.HasIndex(e => e.ChangedAt);

    entity.Property(e => e.ChangedAt).IsRequired();
    entity.Property(e => e.PreferenceType).IsRequired().HasMaxLength(100);
    entity.Property(e => e.OldValue).IsRequired();
    entity.Property(e => e.NewValue).IsRequired();
    entity.Property(e => e.ChangeMethod).HasMaxLength(50);
    entity.Property(e => e.IpAddress).HasMaxLength(45);

    entity.HasOne(e => e.CommunicationPreferences)
        .WithMany(cp => cp.ConsentHistory)
        .HasForeignKey(e => e.CommunicationPreferencesId)
        .OnDelete(DeleteBehavior.Cascade);
});
```

---

## DbContext Integration

Add these DbSets to `RentManagerDbContext.cs`:

```csharp
public DbSet<PrivacyPolicyVersion> PrivacyPolicyVersions { get; set; } = null!;
public DbSet<UserPrivacyPolicyAcceptance> UserPrivacyPolicyAcceptances { get; set; } = null!;
public DbSet<DataSubjectRequest> DataSubjectRequests { get; set; } = null!;
public DbSet<DataSubjectRequestHistory> DataSubjectRequestHistories { get; set; } = null!;
public DbSet<DataRetentionSchedule> DataRetentionSchedules { get; set; } = null!;
public DbSet<DataDeletionLog> DataDeletionLogs { get; set; } = null!;
public DbSet<CommunicationPreferences> CommunicationPreferences { get; set; } = null!;
public DbSet<CommunicationConsentHistory> CommunicationConsentHistories { get; set; } = null!;
```

---

## Schema Benefits

### 1. Complete Audit Trail
- Every acceptance, request, deletion, and preference change is logged
- IP addresses and user agents for verification
- Timestamps for all actions
- Proof of compliance for regulators

### 2. Version Control
- Multiple privacy policy versions stored
- Users linked to specific versions they accepted
- Change summaries for transparency
- Material vs. non-material change tracking

### 3. GDPR Rights Management
- Structured workflow for data subject requests
- Deadline tracking (1-month requirement)
- Identity verification tracking
- Request history audit log
- Covers all Articles 15-22 rights

### 4. Retention Policy Enforcement
- Documented retention schedules
- Legal justifications
- Automated deletion support
- Review tracking

### 5. Communication Consent
- Granular opt-in/opt-out controls
- Separate transactional from marketing
- Full consent history
- Article 7 compliant consent management

### 6. Compliance Demonstration
- Permanent deletion logs (survive data deletion)
- Request tracking with outcomes
- Policy acceptance proof
- Timeline compliance tracking

---

## Usage Examples

### Creating a New Privacy Policy Version

```csharp
var newVersion = new PrivacyPolicyVersion
{
    Version = "2.0",
    ContentHtml = "<html>...full policy HTML...</html>",
    ContentPlainText = "Full policy plain text...",
    EffectiveDate = DateTimeOffset.UtcNow.AddDays(30), // 30-day notice
    CreatedBy = currentUserId,
    IsCurrent = false, // Not yet active
    RequiresReAcceptance = true, // Material change
    ChangesSummary = "Added new third-party data processor (Stripe for payments). " +
                     "Updated data retention periods for financial records."
};

await _context.PrivacyPolicyVersions.AddAsync(newVersion);
await _context.SaveChangesAsync();
```

### Recording User Acceptance

```csharp
var acceptance = new UserPrivacyPolicyAcceptance
{
    UserId = user.Id,
    PolicyVersionId = currentPolicy.Id,
    AcceptedAt = DateTimeOffset.UtcNow,
    IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
    UserAgent = Request.Headers["User-Agent"].ToString(),
    AcceptanceMethod = "registration",
    WasShownChangesSummary = false
};

await _context.UserPrivacyPolicyAcceptances.AddAsync(acceptance);
await _context.SaveChangesAsync();
```

### Creating a Data Subject Request

```csharp
var request = new DataSubjectRequest
{
    RequestNumber = $"DSR-{DateTime.UtcNow.Year}-{nextSequence:D5}",
    UserId = user.Id,
    Email = user.Email,
    RequestType = DataSubjectRequestType.Access,
    Status = DataSubjectRequestStatus.Pending,
    SubmittedAt = DateTimeOffset.UtcNow,
    DueDate = DateTimeOffset.UtcNow.AddMonths(1), // GDPR: 1 month
    IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
    UserAgent = Request.Headers["User-Agent"].ToString(),
    RequestDetails = "User requested copy of all personal data",
    IdentityVerified = true,
    VerificationMethod = "email_confirmation"
};

await _context.DataSubjectRequests.AddAsync(request);

// Add history entry
var historyEntry = new DataSubjectRequestHistory
{
    DataSubjectRequest = request,
    OccurredAt = DateTimeOffset.UtcNow,
    PerformedBy = "system",
    Action = "request_created",
    NewStatus = DataSubjectRequestStatus.Pending,
    Description = "Data subject request submitted via user portal"
};

await _context.DataSubjectRequestHistories.AddAsync(historyEntry);
await _context.SaveChangesAsync();
```

### Logging Data Deletion

```csharp
var deletionLog = new DataDeletionLog
{
    UserId = user.Id,
    Email = user.Email,
    DeletedAt = DateTimeOffset.UtcNow,
    Reason = DeletionReason.UserRequest,
    TriggerType = "user_request",
    DataSubjectRequestId = dsrRequest.Id,
    DeletedBy = currentAdminUserId,
    DataCategoriesDeleted = JsonSerializer.Serialize(new[]
    {
        "user_profile",
        "preferences",
        "communication_history",
        "property_views"
    }),
    DataRetainedReason = "Financial records retained for 7 years per tax compliance requirements",
    Notes = "User requested account deletion. Payment history retained per legal obligation."
};

await _context.DataDeletionLogs.AddAsync(deletionLog);
await _context.SaveChangesAsync();
```

### Updating Communication Preferences

```csharp
// Get or create preferences
var preferences = await _context.CommunicationPreferences
    .FirstOrDefaultAsync(cp => cp.UserId == userId);

if (preferences == null)
{
    preferences = new CommunicationPreferences { UserId = userId };
    await _context.CommunicationPreferences.AddAsync(preferences);
}

// Track change
var oldValue = preferences.MarketingEmails;
preferences.MarketingEmails = false;
preferences.LastUpdated = DateTimeOffset.UtcNow;
preferences.IpAddress = ipAddress;

// Add history
var history = new CommunicationConsentHistory
{
    CommunicationPreferences = preferences,
    ChangedAt = DateTimeOffset.UtcNow,
    PreferenceType = "MarketingEmails",
    OldValue = oldValue,
    NewValue = false,
    ChangeMethod = "user_settings",
    IpAddress = ipAddress
};

await _context.CommunicationConsentHistories.AddAsync(history);
await _context.SaveChangesAsync();
```

---

## Migration Strategy

### Phase 1: Core Privacy Policy Management
1. Create `PrivacyPolicyVersion` table
2. Create `UserPrivacyPolicyAcceptance` table
3. Seed initial privacy policy version (v1.0)

### Phase 2: Data Subject Rights
1. Create `DataSubjectRequest` table
2. Create `DataSubjectRequestHistory` table
3. Create request number sequence generator

### Phase 3: Retention & Deletion
1. Create `DataRetentionSchedule` table
2. Seed initial retention policies
3. Create `DataDeletionLog` table

### Phase 4: Communication Preferences
1. Create `CommunicationPreferences` table
2. Create `CommunicationConsentHistory` table
3. Seed default preferences for existing users

---

## Related Documentation

- [Privacy Policy Strategy](../product/PRIVACY_POLICY_STRATEGY.md) - Full privacy policy implementation strategy
- [Cookie Policy Quick Start](../product/COOKIE_POLICY_QUICK_START.md) - Cookie consent implementation guide
- [Email Notification Roadmap](../EMAIL_NOTIFICATION_ROADMAP.md) - Email notification features

---

## Compliance References

- **GDPR Article 7**: Conditions for consent
- **GDPR Article 13**: Information to be provided where personal data are collected from the data subject
- **GDPR Articles 15-22**: Data subject rights
- **GDPR Article 30**: Records of processing activities
- **GDPR Article 32**: Security of processing
- **CCPA Section 1798.100**: Consumer's right to know
- **CCPA Section 1798.105**: Consumer's right to deletion

---

**Last Updated**: 2025-11-14
**Version**: 1.0
