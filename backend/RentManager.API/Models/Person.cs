namespace RentManager.API.Models
{
    public class Person
    {
        public string Id { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string MiddleName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? IdNumber { get; set; }
        public string? Nationality { get; set; }
        public string? Occupation { get; set; }
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

        // Computed property for full name
        public string FullName
        {
            get
            {
                var parts = new[] { FirstName, MiddleName, LastName }
                    .Where(p => !string.IsNullOrWhiteSpace(p))
                    .Select(p => p.Trim());
                return string.Join(" ", parts);
            }
        }
    }
}