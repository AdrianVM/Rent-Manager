namespace RentManager.API.Models
{
    public class Property
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public PropertyType Type { get; set; }
        public int? Bedrooms { get; set; }
        public decimal? Bathrooms { get; set; }
        public decimal RentAmount { get; set; }
        public string? Description { get; set; }
        public ParkingType? ParkingType { get; set; }
        public string? SpaceNumber { get; set; }
        public int? SquareFootage { get; set; }
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

        // Navigation properties
        public ICollection<PropertyOwner> PropertyOwners { get; set; } = new List<PropertyOwner>();
        public ICollection<Tenant> Tenants { get; set; } = new List<Tenant>();
    }

    public enum PropertyType
    {
        Apartment,
        House,
        Condo,
        Commercial,
        ParkingSpace
    }

    public enum ParkingType
    {
        Outdoor,
        Covered,
        Garage,
        Underground
    }
}