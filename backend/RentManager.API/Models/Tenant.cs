namespace RentManager.API.Models
{
    public class Tenant
    {
        public string Id { get; set; } = string.Empty;

        // Discriminator for tenant type
        public TenantType TenantType { get; set; } = TenantType.Person;

        // Common fields
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }

        // Navigation properties to Person and Company entities
        public string? PersonId { get; set; }
        public Person? Person { get; set; }

        public string? CompanyId { get; set; }
        public Company? Company { get; set; }

        public string PropertyId { get; set; } = string.Empty;
        public Property Property { get; set; } = null!;
        public DateTime? LeaseStart { get; set; }
        public DateTime? LeaseEnd { get; set; }
        public decimal RentAmount { get; set; }
        public decimal? Deposit { get; set; }
        public TenantStatus Status { get; set; } = TenantStatus.Active;

        // Type-specific details (for company tenants)
        public CompanyDetails? CompanyDetails { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

                // Emergency contact information
        public string? EmergencyContactName { get; set; }
        public string? EmergencyContactPhone { get; set; }
        public string? EmergencyContactRelation { get; set; }

        // Computed property for display name
        public string Name => TenantType == TenantType.Person
            ? string.IsNullOrWhiteSpace(Person?.FullName) ? "Unknown" : Person.FullName
            : string.IsNullOrWhiteSpace(CompanyDetails?.CompanyName) ? "Unknown" : CompanyDetails.CompanyName;
    }

    public enum TenantType
    {
        Person,
        Company
    }

    public class CompanyDetails
    {
        public string CompanyName { get; set; } = string.Empty;
        public string? TaxId { get; set; }
        public string? RegistrationNumber { get; set; }
        public string? LegalForm { get; set; }  // LLC, Inc, Corp, Partnership, etc.
        public string? Industry { get; set; }

        // Primary contact person at the company
        public string? ContactPersonName { get; set; }
        public string? ContactPersonTitle { get; set; }
        public string? ContactPersonEmail { get; set; }
        public string? ContactPersonPhone { get; set; }

        // Billing information (if different from property address)
        public string? BillingAddress { get; set; }
    }

    public enum TenantStatus
    {
        Active,
        Inactive,
        Pending
    }
}