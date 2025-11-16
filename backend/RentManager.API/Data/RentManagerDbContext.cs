using Microsoft.EntityFrameworkCore;
using RentManager.API.Models;

namespace RentManager.API.Data
{
    public class RentManagerDbContext : DbContext
    {
        public RentManagerDbContext(DbContextOptions<RentManagerDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Role> Roles { get; set; } = null!;
        public DbSet<UserRole> UserRoles { get; set; } = null!;
        public DbSet<Property> Properties { get; set; } = null!;
        public DbSet<PropertyOwner> PropertyOwners { get; set; } = null!;
        public DbSet<Tenant> Tenants { get; set; } = null!;
        public DbSet<Payment> Payments { get; set; } = null!;
        public DbSet<Contract> Contracts { get; set; } = null!;
        public DbSet<TenantInvitation> TenantInvitations { get; set; } = null!;
        public DbSet<Company> Companies { get; set; } = null!;
        public DbSet<Person> Persons { get; set; } = null!;
        public DbSet<MaintenanceRequest> MaintenanceRequests { get; set; } = null!;
        public DbSet<CookieConsent> CookieConsents { get; set; } = null!;
        public DbSet<PrivacyPolicyVersion> PrivacyPolicyVersions { get; set; } = null!;
        public DbSet<UserPrivacyPolicyAcceptance> UserPrivacyPolicyAcceptances { get; set; } = null!;
        public DbSet<DataSubjectRequest> DataSubjectRequests { get; set; } = null!;
        public DbSet<DataSubjectRequestHistory> DataSubjectRequestHistories { get; set; } = null!;
        public DbSet<DataDeletionLog> DataDeletionLogs { get; set; } = null!;
        public DbSet<DataRetentionSchedule> DataRetentionSchedules { get; set; } = null!;
        public DbSet<LegalHold> LegalHolds { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure User entity
            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("users");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Email).IsUnique();
                entity.HasIndex(e => e.PersonId);

                entity.Property(e => e.Id).IsRequired();
                entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
                entity.Property(e => e.PasswordHash).IsRequired();
                entity.Property(e => e.IsActive).IsRequired();
                entity.Property(e => e.CreatedAt).IsRequired();
                entity.Property(e => e.UpdatedAt).IsRequired();

                // Configure relationship with Person (optional)
                entity.HasOne(u => u.Person)
                    .WithMany()
                    .HasForeignKey(u => u.PersonId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // Configure Role entity
            modelBuilder.Entity<Role>(entity =>
            {
                entity.ToTable("roles");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Name).IsUnique();

                entity.Property(e => e.Id).IsRequired();
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.CreatedAt).IsRequired();

                // Seed initial roles
                entity.HasData(
                    new Role { Id = 1, Name = Role.Admin, Description = "Administrator with full system access", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                    new Role { Id = 2, Name = Role.PropertyOwner, Description = "Property owner who manages properties and tenants", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                    new Role { Id = 3, Name = Role.Renter, Description = "Tenant who rents a property", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
                );
            });

            // Configure UserRole entity (junction table)
            modelBuilder.Entity<UserRole>(entity =>
            {
                entity.ToTable("user_roles");
                entity.HasKey(e => new { e.UserId, e.RoleId });

                entity.Property(e => e.AssignedAt).IsRequired();

                // Configure relationships
                entity.HasOne(ur => ur.User)
                    .WithMany(u => u.UserRoles)
                    .HasForeignKey(ur => ur.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(ur => ur.Role)
                    .WithMany(r => r.UserRoles)
                    .HasForeignKey(ur => ur.RoleId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure Property entity
            modelBuilder.Entity<Property>(entity =>
            {
                entity.ToTable("properties");
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Id).IsRequired();
                entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Address).IsRequired().HasMaxLength(500);
                entity.Property(e => e.Type).HasConversion<string>().IsRequired();
                entity.Property(e => e.RentAmount).HasPrecision(18, 2).IsRequired();
                entity.Property(e => e.Bathrooms).HasPrecision(3, 1);
                entity.Property(e => e.Description).HasMaxLength(2000);
                entity.Property(e => e.ParkingType).HasConversion<string>();
                entity.Property(e => e.SpaceNumber).HasMaxLength(50);
                entity.Property(e => e.CreatedAt).IsRequired();
                entity.Property(e => e.UpdatedAt).IsRequired();
            });

            // Configure PropertyOwner entity
            modelBuilder.Entity<PropertyOwner>(entity =>
            {
                entity.ToTable("property_owners");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.PropertyId);

                entity.Property(e => e.Id).IsRequired();
                entity.Property(e => e.PropertyId).IsRequired();
                entity.Property(e => e.CreatedAt).IsRequired();
                entity.Property(e => e.UpdatedAt).IsRequired();

                // Configure relationship with Property
                entity.HasOne(po => po.Property)
                    .WithMany(p => p.PropertyOwners)
                    .HasForeignKey(po => po.PropertyId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Configure many-to-many with Person
                entity.HasMany(po => po.PersonOwners)
                    .WithMany()
                    .UsingEntity(j => j.ToTable("property_owner_persons"));

                // Configure many-to-many with Company
                entity.HasMany(po => po.OwningCompanies)
                    .WithMany()
                    .UsingEntity(j => j.ToTable("property_owner_companies"));
            });

            // Configure Tenant entity
            modelBuilder.Entity<Tenant>(entity =>
            {
                entity.ToTable("tenants");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.PropertyId);
                entity.HasIndex(e => e.PersonId);
                entity.HasIndex(e => e.CompanyId);

                entity.Property(e => e.Id).IsRequired();
                entity.Property(e => e.TenantType).HasConversion<string>().IsRequired();
                entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Phone).HasMaxLength(50);
                entity.Property(e => e.PropertyId).IsRequired();
                entity.Property(e => e.RentAmount).HasPrecision(18, 2).IsRequired();
                entity.Property(e => e.Deposit).HasPrecision(18, 2);
                entity.Property(e => e.Status).HasConversion<string>().IsRequired();
                entity.Property(e => e.CreatedAt).IsRequired();
                entity.Property(e => e.UpdatedAt).IsRequired();

                // Configure relationship with Property
                entity.HasOne(t => t.Property)
                    .WithMany(p => p.Tenants)
                    .HasForeignKey(t => t.PropertyId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Configure relationship with Person (optional, for person tenants)
                entity.HasOne(t => t.Person)
                    .WithMany()
                    .HasForeignKey(t => t.PersonId)
                    .OnDelete(DeleteBehavior.SetNull);

                // Configure relationship with Company (optional, for company tenants)
                entity.HasOne(t => t.Company)
                    .WithMany()
                    .HasForeignKey(t => t.CompanyId)
                    .OnDelete(DeleteBehavior.SetNull);

                // Ignore the computed Name property
                entity.Ignore(e => e.Name);
            });

            // Configure Payment entity
            modelBuilder.Entity<Payment>(entity =>
            {
                entity.ToTable("payments");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.TenantId);
                entity.HasIndex(e => e.Date);

                entity.Property(e => e.Id).IsRequired();
                entity.Property(e => e.TenantId).IsRequired();
                entity.Property(e => e.Amount).HasPrecision(18, 2).IsRequired();
                entity.Property(e => e.Date).IsRequired();
                entity.Property(e => e.Method).HasConversion<string>().IsRequired();
                entity.Property(e => e.Status).HasConversion<string>().IsRequired();
                entity.Property(e => e.Notes).HasMaxLength(1000);
                entity.Property(e => e.CreatedAt).IsRequired();
                entity.Property(e => e.UpdatedAt).IsRequired();
            });

            // Configure Contract entity
            modelBuilder.Entity<Contract>(entity =>
            {
                entity.ToTable("contracts");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.PropertyId);
                entity.HasIndex(e => e.TenantId);

                entity.Property(e => e.Id).IsRequired();
                entity.Property(e => e.PropertyId).IsRequired();
                entity.Property(e => e.TenantId).IsRequired();
                entity.Property(e => e.FileName).IsRequired().HasMaxLength(255);
                entity.Property(e => e.FileContentBase64).IsRequired();
                entity.Property(e => e.MimeType).IsRequired().HasMaxLength(100);
                entity.Property(e => e.FileSizeBytes).IsRequired();
                entity.Property(e => e.UploadedAt).IsRequired();
                entity.Property(e => e.Status).HasConversion<string>().IsRequired();
                entity.Property(e => e.Notes).HasMaxLength(1000);
            });

            // Configure TenantInvitation entity
            modelBuilder.Entity<TenantInvitation>(entity =>
            {
                entity.ToTable("tenant_invitations");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.InvitationToken).IsUnique();
                entity.HasIndex(e => e.PropertyId);
                entity.HasIndex(e => e.Email);

                entity.Property(e => e.Id).IsRequired();
                entity.Property(e => e.PropertyId).IsRequired();
                entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
                entity.Property(e => e.InvitationToken).IsRequired();
                entity.Property(e => e.ExpiresAt).IsRequired();
                entity.Property(e => e.Status).HasConversion<string>().IsRequired();
                entity.Property(e => e.CreatedAt).IsRequired();
                entity.Property(e => e.UpdatedAt).IsRequired();
                entity.Property(e => e.RentAmount).HasPrecision(18, 2);
                entity.Property(e => e.Deposit).HasPrecision(18, 2);
            });

            // Configure Person entity
            modelBuilder.Entity<Person>(entity =>
            {
                entity.ToTable("Persons");
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Id).IsRequired();
                entity.Property(e => e.FirstName).IsRequired().HasMaxLength(255);
                entity.Property(e => e.MiddleName).HasMaxLength(255);
                entity.Property(e => e.LastName).IsRequired().HasMaxLength(255);
                entity.Property(e => e.DateOfBirth);
                entity.Property(e => e.IdNumber);
                entity.Property(e => e.Nationality).HasMaxLength(100);
                entity.Property(e => e.Occupation).HasMaxLength(100);
                entity.Property(e => e.CreatedAt).IsRequired();
                entity.Property(e => e.UpdatedAt).IsRequired();
            });

            // Configure Company entity
            modelBuilder.Entity<Company>(entity =>
            {
                entity.ToTable("Companies");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.BillingAddress).IsRequired();
                entity.Property(e => e.CompanyName).IsRequired();
                entity.Property(e => e.ContactPersonEmail).IsRequired();
                entity.Property(e => e.ContactPersonPhone).IsRequired();
                entity.Property(e => e.ContactPersonTitle).IsRequired();
                entity.Property(e => e.LegalForm);
                entity.Property(e => e.Industry);
                entity.Property(e => e.RegistrationNumber).IsRequired();
                entity.Property(e => e.TaxId);
                entity.Property(e => e.CreatedAt).IsRequired();
                entity.Property(e => e.UpdatedAt).IsRequired();
            });

            // Configure MaintenanceRequest entity
            modelBuilder.Entity<MaintenanceRequest>(entity =>
            {
                entity.ToTable("maintenance_requests");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.TenantId);
                entity.HasIndex(e => e.PropertyId);
                entity.HasIndex(e => e.Status);

                entity.Property(e => e.Id).IsRequired();
                entity.Property(e => e.TenantId).IsRequired();
                entity.Property(e => e.PropertyId).IsRequired();
                entity.Property(e => e.Title).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Description).IsRequired().HasMaxLength(2000);
                entity.Property(e => e.Status).HasConversion<string>().IsRequired();
                entity.Property(e => e.Priority).HasConversion<string>().IsRequired();
                entity.Property(e => e.AssignedTo).HasMaxLength(255);
                entity.Property(e => e.ResolutionNotes).HasMaxLength(2000);
                entity.Property(e => e.CreatedAt).IsRequired();
                entity.Property(e => e.UpdatedAt).IsRequired();

                // Configure relationship with Tenant
                entity.HasOne(mr => mr.Tenant)
                    .WithMany()
                    .HasForeignKey(mr => mr.TenantId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Configure relationship with Property
                entity.HasOne(mr => mr.Property)
                    .WithMany()
                    .HasForeignKey(mr => mr.PropertyId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure CookieConsent entity
            modelBuilder.Entity<CookieConsent>(entity =>
            {
                entity.ToTable("cookie_consents");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.ConsentToken);
                entity.HasIndex(e => e.ExpiryDate);

                entity.Property(e => e.Id).IsRequired();
                entity.Property(e => e.UserId).HasMaxLength(255);
                entity.Property(e => e.ConsentToken).HasMaxLength(255);
                entity.Property(e => e.StrictlyNecessary).IsRequired();
                entity.Property(e => e.Functional).IsRequired();
                entity.Property(e => e.Performance).IsRequired();
                entity.Property(e => e.Marketing).IsRequired();
                entity.Property(e => e.ConsentDate).IsRequired();
                entity.Property(e => e.LastUpdated).IsRequired();
                entity.Property(e => e.IpAddress).HasMaxLength(45); // IPv6 max length
                entity.Property(e => e.UserAgent).HasMaxLength(500);
                entity.Property(e => e.PolicyVersion).IsRequired().HasMaxLength(10);
                entity.Property(e => e.ExpiryDate).IsRequired();
            });

            // Configure PrivacyPolicyVersion entity
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

            // Configure UserPrivacyPolicyAcceptance entity
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

            // Configure DataSubjectRequest entity
            modelBuilder.Entity<DataSubjectRequest>(entity =>
            {
                entity.ToTable("data_subject_requests");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.RequestType);
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.SubmittedAt);
                entity.HasIndex(e => e.DeadlineAt);
                entity.HasIndex(e => new { e.UserId, e.Status });

                entity.Property(e => e.UserId).IsRequired().HasMaxLength(255);
                entity.Property(e => e.RequestType).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Description).HasMaxLength(2000);
                entity.Property(e => e.SubmittedAt).IsRequired();
                entity.Property(e => e.DeadlineAt).IsRequired();
                entity.Property(e => e.IpAddress).HasMaxLength(45);
                entity.Property(e => e.UserAgent).HasMaxLength(500);
                entity.Property(e => e.AssignedToAdminId).HasMaxLength(255);
                entity.Property(e => e.AdminNotes).HasMaxLength(2000);
                entity.Property(e => e.ExportFilePath).HasMaxLength(500);
                entity.Property(e => e.DeletionSummary).HasMaxLength(2000);
                entity.Property(e => e.RetentionSummary).HasMaxLength(2000);
                entity.Property(e => e.VerificationMethod).HasMaxLength(100);
                entity.Property(e => e.IdentityVerified).IsRequired();
            });

            // Configure DataSubjectRequestHistory entity
            modelBuilder.Entity<DataSubjectRequestHistory>(entity =>
            {
                entity.ToTable("data_subject_request_histories");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.RequestId);
                entity.HasIndex(e => e.PerformedAt);

                entity.Property(e => e.Action).IsRequired().HasMaxLength(100);
                entity.Property(e => e.OldStatus).HasMaxLength(50);
                entity.Property(e => e.NewStatus).HasMaxLength(50);
                entity.Property(e => e.Details).HasMaxLength(2000);
                entity.Property(e => e.PerformedBy).HasMaxLength(255);
                entity.Property(e => e.PerformedByRole).HasMaxLength(50);
                entity.Property(e => e.PerformedAt).IsRequired();
                entity.Property(e => e.IpAddress).HasMaxLength(45);

                entity.HasOne(e => e.Request)
                    .WithMany(r => r.History)
                    .HasForeignKey(e => e.RequestId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure DataDeletionLog entity
            modelBuilder.Entity<DataDeletionLog>(entity =>
            {
                entity.ToTable("data_deletion_logs");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.DataCategory);
                entity.HasIndex(e => e.DeletedAt);
                entity.HasIndex(e => e.Reason);
                entity.HasIndex(e => e.RelatedRequestId);

                entity.Property(e => e.UserId).IsRequired().HasMaxLength(255);
                entity.Property(e => e.DataCategory).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Description).HasMaxLength(2000);
                entity.Property(e => e.DeletionMethod).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Reason).IsRequired().HasMaxLength(100);
                entity.Property(e => e.LegalBasis).HasMaxLength(500);
                entity.Property(e => e.DeletedAt).IsRequired();
                entity.Property(e => e.DeletedBy).HasMaxLength(255);
                entity.Property(e => e.IpAddress).HasMaxLength(45);
                entity.Property(e => e.IsReversible).IsRequired();
                entity.Property(e => e.BackupLocation).HasMaxLength(500);
            });

            // Configure DataRetentionSchedule entity
            modelBuilder.Entity<DataRetentionSchedule>(entity =>
            {
                entity.ToTable("data_retention_schedules");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.DataCategory).IsUnique();
                entity.HasIndex(e => e.IsActive);

                entity.Property(e => e.DataCategory).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Description).IsRequired().HasMaxLength(500);
                entity.Property(e => e.RetentionMonths).IsRequired();
                entity.Property(e => e.LegalBasis).IsRequired().HasMaxLength(500);
                entity.Property(e => e.Action).HasConversion<string>().IsRequired();
                entity.Property(e => e.IsActive).IsRequired();
                entity.Property(e => e.CreatedAt).IsRequired();
                entity.Property(e => e.ReviewedBy).HasMaxLength(255);

                // Seed initial retention schedules
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
                        DataCategory = "audit_logs",
                        Description = "System logs, access logs, security logs",
                        RetentionMonths = 3, // 90 days
                        LegalBasis = "Security best practice and GDPR Article 5(2)",
                        Action = RetentionAction.Delete,
                        IsActive = true,
                        CreatedAt = new DateTimeOffset(2025, 1, 1, 0, 0, 0, TimeSpan.Zero)
                    },
                    new DataRetentionSchedule
                    {
                        Id = 3,
                        DataCategory = "cookie_consent",
                        Description = "Cookie consent records",
                        RetentionMonths = 24, // 2 years
                        LegalBasis = "GDPR Article 7 - proof of consent requirement",
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
                        DataCategory = "inactive_accounts",
                        Description = "User accounts inactive for extended periods",
                        RetentionMonths = 36, // 3 years
                        LegalBasis = "Legitimate interest - reduce data storage and security risk",
                        Action = RetentionAction.Delete,
                        IsActive = true,
                        CreatedAt = new DateTimeOffset(2025, 1, 1, 0, 0, 0, TimeSpan.Zero)
                    },
                    new DataRetentionSchedule
                    {
                        Id = 7,
                        DataCategory = "privacy_policy_acceptances",
                        Description = "Privacy policy acceptance records",
                        RetentionMonths = 84, // 7 years
                        LegalBasis = "GDPR Article 7(1) - demonstrable consent requirement",
                        Action = RetentionAction.Archive,
                        IsActive = true,
                        CreatedAt = new DateTimeOffset(2025, 1, 1, 0, 0, 0, TimeSpan.Zero)
                    }
                );
            });

            // Configure LegalHold entity
            modelBuilder.Entity<LegalHold>(entity =>
            {
                entity.ToTable("legal_holds");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.IsActive);
                entity.HasIndex(e => e.PlacedAt);
                entity.HasIndex(e => new { e.UserId, e.IsActive });

                entity.Property(e => e.UserId).IsRequired().HasMaxLength(255);
                entity.Property(e => e.DataCategory).HasMaxLength(100);
                entity.Property(e => e.Reason).IsRequired().HasMaxLength(1000);
                entity.Property(e => e.PlacedAt).IsRequired();
                entity.Property(e => e.PlacedBy).IsRequired().HasMaxLength(255);
                entity.Property(e => e.ReleasedBy).HasMaxLength(255);
                entity.Property(e => e.ReleaseReason).HasMaxLength(1000);
                entity.Property(e => e.IsActive).IsRequired();
                entity.Property(e => e.CaseReference).HasMaxLength(100);
                entity.Property(e => e.Notes).HasMaxLength(2000);
            });
        }
    }
}
