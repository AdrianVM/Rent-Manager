namespace RentManager.API.Models
{
    public class PropertyOwner
    {
        public string Id { get; set; } = string.Empty;

        // Foreign key for Property
        public string PropertyId { get; set; } = string.Empty;

        // Navigation properties
        public Property Property { get; set; } = null!;
        public ICollection<Person> PersonOwners { get; set; } = new List<Person>();
        public ICollection<Company> OwningCompanies { get; set; } = new List<Company>();

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}