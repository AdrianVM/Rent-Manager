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

                // Store PropertyIds as JSON
                entity.Property(e => e.PropertyIds)
                    .HasColumnType("jsonb")
                    .IsRequired();

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

                // Store PersonDetails and CompanyDetails as JSON
                entity.OwnsOne(e => e.PersonDetails, pd =>
                {
                    pd.ToJson("person_details");
                    pd.Property(p => p.FirstName).HasMaxLength(100);
                    pd.Property(p => p.LastName).HasMaxLength(100);
                    pd.Property(p => p.IdNumber).HasMaxLength(100);
                    pd.Property(p => p.Nationality).HasMaxLength(100);
                    pd.Property(p => p.Occupation).HasMaxLength(200);
                    pd.Property(p => p.EmergencyContactName).HasMaxLength(200);
                    pd.Property(p => p.EmergencyContactPhone).HasMaxLength(50);
                    pd.Property(p => p.EmergencyContactRelation).HasMaxLength(100);
                });

                entity.OwnsOne(e => e.CompanyDetails, cd =>
                {
                    cd.ToJson("company_details");
                    cd.Property(c => c.CompanyName).HasMaxLength(255);
                    cd.Property(c => c.TaxId).HasMaxLength(100);
                    cd.Property(c => c.RegistrationNumber).HasMaxLength(100);
                    cd.Property(c => c.LegalForm).HasMaxLength(100);
                    cd.Property(c => c.Industry).HasMaxLength(200);
                    cd.Property(c => c.ContactPersonName).HasMaxLength(200);
                    cd.Property(c => c.ContactPersonTitle).HasMaxLength(100);
                    cd.Property(c => c.ContactPersonEmail).HasMaxLength(255);
                    cd.Property(c => c.ContactPersonPhone).HasMaxLength(50);
                    cd.Property(c => c.BillingAddress).HasMaxLength(500);
                });

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
        }
    }
}
