using Microsoft.EntityFrameworkCore;
using RentManager.API.Models;

namespace RentManager.API.Data
{
    public interface IUnitOfWork
    {
        public DbSet<User> Users { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<UserRole> UserRoles { get; set; }
        public DbSet<Property> Properties { get; set; }
        public DbSet<PropertyOwner> PropertyOwners { get; set; }
        public DbSet<Tenant> Tenants { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Contract> Contracts { get; set; }
        public DbSet<TenantInvitation> TenantInvitations { get; set; }
        public DbSet<Company> Companies { get; set; }
        public DbSet<Person> Persons { get; set; }
        public DbSet<MaintenanceRequest> MaintenanceRequests { get; set; }
        public DbSet<CookieConsent> CookieConsents { get; set; }
        public DbSet<PrivacyPolicyVersion> PrivacyPolicyVersions { get; set; }
        public DbSet<UserPrivacyPolicyAcceptance> UserPrivacyPolicyAcceptances { get; set; }
        public DbSet<DataSubjectRequest> DataSubjectRequests { get; set; }
        public DbSet<DataSubjectRequestHistory> DataSubjectRequestHistories { get; set; }
        public DbSet<DataDeletionLog> DataDeletionLogs { get; set; }
        public DbSet<DataRetentionSchedule> DataRetentionSchedules { get; set; }
        public DbSet<LegalHold> LegalHolds { get; set; }

        public Task<int> SaveChangesAsync(CancellationToken token=default);
    }
}
