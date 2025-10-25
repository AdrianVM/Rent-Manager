namespace RentManager.API.Models
{
    public class Company
    {
        public string Id { get; set; } = string.Empty;
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
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}