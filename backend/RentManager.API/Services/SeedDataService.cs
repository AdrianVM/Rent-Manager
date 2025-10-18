using RentManager.API.Models;

namespace RentManager.API.Services
{
    public class SeedDataService
    {
        private readonly IDataService _dataService;
        private readonly IAuthService _authService;

        public SeedDataService(IDataService dataService, IAuthService authService)
        {
            _dataService = dataService;
            _authService = authService;
        }

        public async Task SeedAllDataAsync()
        {
            // Seed data in order (properties first, then tenants, then payments)
            var properties = await SeedPropertiesAsync();
            var tenants = await SeedTenantsAsync(properties);
            await SeedPaymentsAsync(tenants);

            // Update property owner user with property IDs
            await UpdatePropertyOwnerWithPropertyIds(properties);

            // Update renter user with tenant ID
            await UpdateRenterWithTenantId(tenants);
        }

        private async Task<List<Property>> SeedPropertiesAsync()
        {
            var properties = new List<Property>
            {
                new Property
                {
                    Name = "Sunset Apartments - Unit 4B",
                    Address = "123 Sunset Boulevard, Los Angeles, CA 90210",
                    Type = PropertyType.Apartment,
                    Bedrooms = 2,
                    Bathrooms = 2,
                    RentAmount = 2500,
                    Description = "Modern 2-bedroom apartment with city views, updated kitchen, and in-unit laundry."
                },
                new Property
                {
                    Name = "Downtown Luxury Condo",
                    Address = "456 Downtown Avenue, Unit 15A, Los Angeles, CA 90012",
                    Type = PropertyType.Condo,
                    Bedrooms = 1,
                    Bathrooms = 1,
                    RentAmount = 3200,
                    Description = "High-rise luxury condo with panoramic city views, concierge service, and gym access."
                },
                new Property
                {
                    Name = "Family House on Oak Street",
                    Address = "789 Oak Street, Pasadena, CA 91101",
                    Type = PropertyType.House,
                    Bedrooms = 4,
                    Bathrooms = 3,
                    RentAmount = 4500,
                    Description = "Spacious family home with large backyard, 2-car garage, and excellent school district."
                },
                new Property
                {
                    Name = "Covered Parking Space - A12",
                    Address = "100 Business Plaza, Parking Level B1, Space A12",
                    Type = PropertyType.ParkingSpace,
                    ParkingType = ParkingType.Covered,
                    SpaceNumber = "A12",
                    RentAmount = 150,
                    Description = "Secure covered parking space in downtown business district."
                },
                new Property
                {
                    Name = "Downtown Office Suite",
                    Address = "300 Corporate Drive, Suite 201, Los Angeles, CA 90015",
                    Type = PropertyType.Commercial,
                    SquareFootage = 2500,
                    RentAmount = 8000,
                    Description = "Modern office space with conference rooms, reception area, and premium location."
                },
                new Property
                {
                    Name = "Garden Apartment - Unit 2C",
                    Address = "500 Garden View Drive, Unit 2C, Beverly Hills, CA 90210",
                    Type = PropertyType.Apartment,
                    Bedrooms = 3,
                    Bathrooms = 2,
                    RentAmount = 3800,
                    Description = "Elegant garden apartment with private patio and premium amenities."
                },
                new Property
                {
                    Name = "Studio Apartment",
                    Address = "700 College Avenue, Unit 8, Westwood, CA 90024",
                    Type = PropertyType.Apartment,
                    Bedrooms = 0,
                    Bathrooms = 1,
                    RentAmount = 1800,
                    Description = "Cozy studio apartment perfect for students, near UCLA campus."
                }
            };

            var createdProperties = new List<Property>();
            foreach (var property in properties)
            {
                var created = await _dataService.CreatePropertyAsync(property);
                createdProperties.Add(created);
            }

            return createdProperties;
        }

        private async Task<List<Tenant>> SeedTenantsAsync(List<Property> properties)
        {
            var tenants = new List<Tenant>
            {
                new Tenant
                {
                    Id = "tenant-1", // Fixed ID to match renter user
                    TenantType = TenantType.Person,
                    Email = "john.smith@email.com",
                    Phone = "+1 (555) 123-4567",
                    PropertyId = properties[0].Id, // Sunset Apartments
                    LeaseStart = new DateTime(2023, 6, 1, 0, 0, 0, DateTimeKind.Utc),
                    LeaseEnd = new DateTime(2024, 5, 31, 0, 0, 0, DateTimeKind.Utc),
                    RentAmount = 2500,
                    Deposit = 2500,
                    Status = TenantStatus.Active,
                    PersonDetails = new PersonDetails
                    {
                        FirstName = "John",
                        LastName = "Smith",
                        DateOfBirth = new DateTime(1985, 3, 15, 0, 0, 0, DateTimeKind.Utc),
                        IdNumber = "XXX-XX-1234",
                        Nationality = "American",
                        Occupation = "Software Engineer",
                        EmergencyContactName = "Jane Smith",
                        EmergencyContactPhone = "+1 (555) 123-9999",
                        EmergencyContactRelation = "Spouse"
                    }
                },
                new Tenant
                {
                    TenantType = TenantType.Person,
                    Email = "sarah.johnson@email.com",
                    Phone = "+1 (555) 234-5678",
                    PropertyId = properties[1].Id, // Downtown Luxury Condo
                    LeaseStart = new DateTime(2023, 3, 1, 0, 0, 0, DateTimeKind.Utc),
                    LeaseEnd = new DateTime(2024, 2, 28, 0, 0, 0, DateTimeKind.Utc),
                    RentAmount = 3200,
                    Deposit = 3200,
                    Status = TenantStatus.Active,
                    PersonDetails = new PersonDetails
                    {
                        FirstName = "Sarah",
                        LastName = "Johnson",
                        DateOfBirth = new DateTime(1990, 7, 22, 0, 0, 0, DateTimeKind.Utc),
                        IdNumber = "XXX-XX-5678",
                        Nationality = "American",
                        Occupation = "Marketing Manager",
                        EmergencyContactName = "Robert Johnson",
                        EmergencyContactPhone = "+1 (555) 234-8888",
                        EmergencyContactRelation = "Father"
                    }
                },
                new Tenant
                {
                    TenantType = TenantType.Person,
                    Email = "michael.davis@email.com",
                    Phone = "+1 (555) 345-6789",
                    PropertyId = properties[2].Id, // Family House
                    LeaseStart = new DateTime(2023, 8, 1, 0, 0, 0, DateTimeKind.Utc),
                    LeaseEnd = new DateTime(2024, 7, 31, 0, 0, 0, DateTimeKind.Utc),
                    RentAmount = 4500,
                    Deposit = 4500,
                    Status = TenantStatus.Active,
                    PersonDetails = new PersonDetails
                    {
                        FirstName = "Michael",
                        LastName = "Davis",
                        DateOfBirth = new DateTime(1982, 11, 8, 0, 0, 0, DateTimeKind.Utc),
                        IdNumber = "XXX-XX-9012",
                        Nationality = "American",
                        Occupation = "School Teacher",
                        EmergencyContactName = "Lisa Davis",
                        EmergencyContactPhone = "+1 (555) 345-7777",
                        EmergencyContactRelation = "Spouse"
                    }
                },
                new Tenant
                {
                    TenantType = TenantType.Company,
                    Email = "parking@corporate.com",
                    Phone = "+1 (555) 456-7890",
                    PropertyId = properties[3].Id, // Parking Space
                    LeaseStart = new DateTime(2023, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    LeaseEnd = new DateTime(2023, 12, 31, 0, 0, 0, DateTimeKind.Utc),
                    RentAmount = 150,
                    Deposit = 300,
                    Status = TenantStatus.Active,
                    CompanyDetails = new CompanyDetails
                    {
                        CompanyName = "Corporate Parking LLC",
                        TaxId = "12-3456789",
                        RegistrationNumber = "LLC-2020-45678",
                        LegalForm = "LLC",
                        Industry = "Parking Management",
                        ContactPersonName = "David Wilson",
                        ContactPersonTitle = "Facilities Manager",
                        ContactPersonEmail = "david.wilson@corporate.com",
                        ContactPersonPhone = "+1 (555) 456-7890"
                    }
                },
                new Tenant
                {
                    TenantType = TenantType.Company,
                    Email = "facilities@techcorp.com",
                    Phone = "+1 (555) 567-8901",
                    PropertyId = properties[4].Id, // Office Suite
                    LeaseStart = new DateTime(2022, 10, 1, 0, 0, 0, DateTimeKind.Utc),
                    LeaseEnd = new DateTime(2025, 9, 30, 0, 0, 0, DateTimeKind.Utc),
                    RentAmount = 8000,
                    Deposit = 16000,
                    Status = TenantStatus.Active,
                    CompanyDetails = new CompanyDetails
                    {
                        CompanyName = "TechCorp Solutions",
                        TaxId = "98-7654321",
                        RegistrationNumber = "C-2018-98765",
                        LegalForm = "Corporation",
                        Industry = "Technology Services",
                        ContactPersonName = "Jennifer Martinez",
                        ContactPersonTitle = "Office Manager",
                        ContactPersonEmail = "jennifer.martinez@techcorp.com",
                        ContactPersonPhone = "+1 (555) 567-8901",
                        BillingAddress = "TechCorp Solutions, P.O. Box 12345, Los Angeles, CA 90001"
                    }
                },
                new Tenant
                {
                    TenantType = TenantType.Person,
                    Email = "emily.rodriguez@email.com",
                    Phone = "+1 (555) 678-9012",
                    PropertyId = properties[5].Id, // Garden Apartment
                    LeaseStart = new DateTime(2023, 4, 1, 0, 0, 0, DateTimeKind.Utc),
                    LeaseEnd = new DateTime(2024, 3, 31, 0, 0, 0, DateTimeKind.Utc),
                    RentAmount = 3800,
                    Deposit = 3800,
                    Status = TenantStatus.Active,
                    PersonDetails = new PersonDetails
                    {
                        FirstName = "Emily",
                        LastName = "Rodriguez",
                        DateOfBirth = new DateTime(1988, 5, 30, 0, 0, 0, DateTimeKind.Utc),
                        IdNumber = "XXX-XX-3456",
                        Nationality = "American",
                        Occupation = "Graphic Designer",
                        EmergencyContactName = "Carlos Rodriguez",
                        EmergencyContactPhone = "+1 (555) 678-6666",
                        EmergencyContactRelation = "Brother"
                    }
                },
                new Tenant
                {
                    TenantType = TenantType.Person,
                    Email = "alex.chen@student.ucla.edu",
                    Phone = "+1 (555) 789-0123",
                    PropertyId = properties[6].Id, // Studio Apartment
                    LeaseStart = new DateTime(2023, 9, 1, 0, 0, 0, DateTimeKind.Utc),
                    LeaseEnd = new DateTime(2024, 6, 30, 0, 0, 0, DateTimeKind.Utc),
                    RentAmount = 1800,
                    Deposit = 1800,
                    Status = TenantStatus.Active,
                    PersonDetails = new PersonDetails
                    {
                        FirstName = "Alex",
                        LastName = "Chen",
                        DateOfBirth = new DateTime(2001, 12, 5, 0, 0, 0, DateTimeKind.Utc),
                        IdNumber = "XXX-XX-7890",
                        Nationality = "American",
                        Occupation = "Student",
                        EmergencyContactName = "Ming Chen",
                        EmergencyContactPhone = "+1 (555) 789-5555",
                        EmergencyContactRelation = "Parent"
                    }
                }
            };

            var createdTenants = new List<Tenant>();
            foreach (var tenant in tenants)
            {
                var created = await _dataService.CreateTenantAsync(tenant);
                createdTenants.Add(created);
            }

            return createdTenants;
        }

        private async Task SeedPaymentsAsync(List<Tenant> tenants)
        {
            var payments = new List<Payment>();

            foreach (var tenant in tenants)
            {
                // Create payment history for each tenant
                var paymentDates = new[]
                {
                    new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    new DateTime(2023, 12, 1, 0, 0, 0, DateTimeKind.Utc),
                    new DateTime(2023, 11, 1, 0, 0, 0, DateTimeKind.Utc),
                    new DateTime(2023, 10, 1, 0, 0, 0, DateTimeKind.Utc)
                };

                var methods = new[] { PaymentMethod.BankTransfer, PaymentMethod.Check, PaymentMethod.Online };
                var random = new Random();

                foreach (var date in paymentDates)
                {
                    var payment = new Payment
                    {
                        TenantId = tenant.Id,
                        Amount = tenant.RentAmount,
                        Date = date,
                        Method = methods[random.Next(methods.Length)],
                        Status = PaymentStatus.Completed,
                        Notes = $"{date.ToString("MMMM")} rent payment"
                    };

                    payments.Add(payment);
                }
            }

            // Add a partial payment and a pending payment for realism
            if (tenants.Count > 1)
            {
                payments.Add(new Payment
                {
                    TenantId = tenants[1].Id,
                    Amount = tenants[1].RentAmount * 0.5m,
                    Date = new DateTime(2024, 2, 1, 0, 0, 0, DateTimeKind.Utc),
                    Method = PaymentMethod.Online,
                    Status = PaymentStatus.Completed,
                    Notes = "Partial February payment"
                });

                payments.Add(new Payment
                {
                    TenantId = tenants[2].Id,
                    Amount = tenants[2].RentAmount,
                    Date = new DateTime(2024, 2, 5, 0, 0, 0, DateTimeKind.Utc),
                    Method = PaymentMethod.Check,
                    Status = PaymentStatus.Pending,
                    Notes = "February rent payment - check processing"
                });
            }

            foreach (var payment in payments)
            {
                await _dataService.CreatePaymentAsync(payment);
            }
        }

        private async Task UpdatePropertyOwnerWithPropertyIds(List<Property> properties)
        {
            // Get the property owner user and assign all property IDs to them
            var propertyOwner = await _authService.GetUserByEmailAsync("owner@rentmanager.com");
            if (propertyOwner != null)
            {
                propertyOwner.PropertyIds = properties.Select(p => p.Id).ToList();
            }
        }

        private async Task UpdateRenterWithTenantId(List<Tenant> tenants)
        {
            // Get the renter user and assign the first tenant ID to them
            var renter = await _authService.GetUserByEmailAsync("renter@rentmanager.com");
            if (renter != null && tenants.Count > 0)
            {
                renter.TenantId = tenants[0].Id;
            }
        }
    }
}