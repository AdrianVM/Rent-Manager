using Microsoft.EntityFrameworkCore;
using RentManager.API.Data;
using RentManager.API.Models;

namespace RentManager.API.Services
{
    public class SeedDataService
    {
        private readonly IDataService _dataService;
        private readonly IAuthService _authService;
        private readonly RentManagerDbContext _context;

        public SeedDataService(IDataService dataService, IAuthService authService, RentManagerDbContext context)
        {
            _dataService = dataService;
            _authService = authService;
            _context = context;
        }

        public async Task SeedAllDataAsync(string userEmail)
        {
            // Create the main user with multiple roles
            var mainUser = await CreateMainUserAsync(userEmail);

            // Seed data in order (properties first, then property owners, then tenants, then payments, then maintenance requests)
            var properties = await SeedPropertiesAsync();
            await SeedPropertyOwnersAsync(properties, mainUser);
            var tenants = await SeedTenantsAsync(properties, mainUser);
            await SeedPaymentsAsync(tenants);
            await SeedMaintenanceRequestsAsync(tenants, properties);
        }

        private async Task<User> CreateMainUserAsync(string userEmail)
        {

            // Check if user already exists
            var existingUser = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .Include(u => u.Person)
                .FirstOrDefaultAsync(u => u.Email == userEmail);

            if (existingUser != null)
            {
                // Create Person record if user doesn't have one
                if (existingUser.Person == null)
                {
                    // Extract name from email (part before @) and capitalize
                    var emailName = existingUser.Email.Split('@')[0];
                    var displayName = string.Join(" ", emailName.Split('.', '_', '-')
                        .Select(part => char.ToUpper(part[0]) + part.Substring(1).ToLower()));
                    var nameParts = displayName.Split(' ', StringSplitOptions.RemoveEmptyEntries);

                    var person = new Person
                    {
                        Id = Guid.NewGuid().ToString(),
                        FirstName = nameParts.Length > 0 ? nameParts[0] : displayName,
                        MiddleName = nameParts.Length > 2 ? nameParts[1] : string.Empty,
                        LastName = nameParts.Length > 1 ? nameParts[^1] : string.Empty,
                        DateOfBirth = new DateTime(1990, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                        Nationality = "Demo",
                        Occupation = "Demo User",
                        CreatedAt = DateTimeOffset.UtcNow,
                        UpdatedAt = DateTimeOffset.UtcNow
                    };

                    _context.Persons.Add(person);
                    await _context.SaveChangesAsync();

                    existingUser.PersonId = person.Id;
                    existingUser.UpdatedAt = DateTimeOffset.UtcNow;
                    await _context.SaveChangesAsync();
                }

                // Clear existing roles
                _context.UserRoles.RemoveRange(existingUser.UserRoles);
                await _context.SaveChangesAsync();

                // Re-query to get fresh instance
                existingUser = await _context.Users
                    .Include(u => u.UserRoles)
                        .ThenInclude(ur => ur.Role)
                    .Include(u => u.Person)
                    .FirstAsync(u => u.Email == userEmail);
            }
            else
            {
                // Create new user
                // Extract name from email (part before @) and capitalize
                var emailName = userEmail.Split('@')[0];
                var displayName = string.Join(" ", emailName.Split('.', '_', '-')
                    .Select(part => char.ToUpper(part[0]) + part.Substring(1).ToLower()));

                // Create a Person record for the user
                var nameParts = displayName.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                var person = new Person
                {
                    Id = Guid.NewGuid().ToString(),
                    FirstName = nameParts.Length > 0 ? nameParts[0] : displayName,
                    MiddleName = nameParts.Length > 2 ? nameParts[1] : string.Empty,
                    LastName = nameParts.Length > 1 ? nameParts[^1] : string.Empty,
                    DateOfBirth = new DateTime(1990, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    Nationality = "Demo",
                    Occupation = "Demo User",
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                };

                _context.Persons.Add(person);
                await _context.SaveChangesAsync();

                existingUser = new User
                {
                    Id = Guid.NewGuid().ToString(),
                    Email = userEmail,
                    PasswordHash = "not-used-zitadel-auth", // Using Zitadel for authentication
                    IsActive = true,
                    PersonId = person.Id,
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                };

                _context.Users.Add(existingUser);
                await _context.SaveChangesAsync();
            }

            // Get all roles from database
            var adminRole = await _context.Roles.FirstAsync(r => r.Name == Role.Admin);
            var propertyOwnerRole = await _context.Roles.FirstAsync(r => r.Name == Role.PropertyOwner);
            var renterRole = await _context.Roles.FirstAsync(r => r.Name == Role.Renter);

            // Add all three roles to the user
            var userRoles = new List<UserRole>
            {
                new UserRole { UserId = existingUser.Id, RoleId = adminRole.Id, AssignedAt = DateTimeOffset.UtcNow },
                new UserRole { UserId = existingUser.Id, RoleId = propertyOwnerRole.Id, AssignedAt = DateTimeOffset.UtcNow },
                new UserRole { UserId = existingUser.Id, RoleId = renterRole.Id, AssignedAt = DateTimeOffset.UtcNow }
            };

            _context.UserRoles.AddRange(userRoles);
            await _context.SaveChangesAsync();

            // Reload user with roles and person
            return await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .Include(u => u.Person)
                .FirstAsync(u => u.Id == existingUser.Id);
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

        private async Task SeedPropertyOwnersAsync(List<Property> properties, User mainUser)
        {
            // Create PropertyOwner records for each property with the main user's Person as owner
            if (mainUser.Person == null)
            {
                return; // Skip if user doesn't have a Person record
            }

            foreach (var property in properties)
            {
                var propertyOwner = new PropertyOwner
                {
                    Id = Guid.NewGuid().ToString(),
                    PropertyId = property.Id,
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                };

                _context.PropertyOwners.Add(propertyOwner);
                await _context.SaveChangesAsync();

                // Load the PropertyOwner with navigation properties
                var loadedPropertyOwner = await _context.PropertyOwners
                    .Include(po => po.PersonOwners)
                    .FirstAsync(po => po.Id == propertyOwner.Id);

                // Add the Person to the PropertyOwner
                loadedPropertyOwner.PersonOwners.Add(mainUser.Person);
                await _context.SaveChangesAsync();
            }
        }

    private async Task<List<Tenant>> SeedTenantsAsync(List<Property> properties, User mainUser)
    {
        // Create one tenant for the main user using their Person entity
        var tenant = new Tenant
        {
            Id = "tenant-main-user", // Fixed ID for main user
            TenantType = TenantType.Person,
            Email = mainUser.Email,
            Phone = "+1 (555) 000-0000",
            PersonId = mainUser.PersonId, // Link to the main user's Person
            PropertyId = properties[0].Id, // First property
            LeaseStart = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            LeaseEnd = new DateTime(2025, 12, 31, 0, 0, 0, DateTimeKind.Utc),
            RentAmount = 2500,
            Deposit = 2500,
            Status = TenantStatus.Active,
            EmergencyContactName = "Emergency Contact",
            EmergencyContactPhone = "+1 (555) 999-9999",
            EmergencyContactRelation = "Family"
        };

        var createdTenant = await _dataService.CreateTenantAsync(tenant);
        return new List<Tenant> { createdTenant };
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

        private async Task SeedMaintenanceRequestsAsync(List<Tenant> tenants, List<Property> properties)
        {
            if (!tenants.Any())
            {
                return;
            }

            var tenant = tenants[0];
            var property = properties[0];

            var now = DateTimeOffset.UtcNow;
            var today = new DateTimeOffset(now.Year, now.Month, now.Day, 10, 30, 0, now.Offset);
            var yesterday = today.AddDays(-1);
            var twoDaysAgo = today.AddDays(-2);

            var maintenanceRequests = new List<MaintenanceRequest>
            {
                // Two days ago - Completed
                new MaintenanceRequest
                {
                    Id = Guid.NewGuid().ToString(),
                    TenantId = tenant.Id,
                    PropertyId = property.Id,
                    Title = "Leaky Kitchen Faucet",
                    Description = "The kitchen faucet has been dripping constantly for the past week. It's wasting water and the sound is quite annoying.",
                    Priority = MaintenancePriority.Medium,
                    Status = MaintenanceStatus.Completed,
                    AssignedTo = "Mike Johnson",
                    ResolutionNotes = "Replaced the faucet cartridge and checked all seals. No more leaks detected.",
                    CreatedAt = twoDaysAgo,
                    UpdatedAt = yesterday,
                    ResolvedAt = yesterday
                },
                // Yesterday - In Progress
                new MaintenanceRequest
                {
                    Id = Guid.NewGuid().ToString(),
                    TenantId = tenant.Id,
                    PropertyId = property.Id,
                    Title = "Broken Window Lock",
                    Description = "The lock on the bedroom window is broken and won't secure properly. This is a security concern.",
                    Priority = MaintenancePriority.High,
                    Status = MaintenanceStatus.InProgress,
                    AssignedTo = "Sarah Williams",
                    CreatedAt = yesterday,
                    UpdatedAt = today
                },
                // Yesterday - Pending
                new MaintenanceRequest
                {
                    Id = Guid.NewGuid().ToString(),
                    TenantId = tenant.Id,
                    PropertyId = property.Id,
                    Title = "Noisy Ceiling Fan",
                    Description = "The ceiling fan in the living room makes a loud rattling noise when running at medium or high speed.",
                    Priority = MaintenancePriority.Low,
                    Status = MaintenanceStatus.Pending,
                    CreatedAt = yesterday,
                    UpdatedAt = yesterday
                },
                // Today - Emergency
                new MaintenanceRequest
                {
                    Id = Guid.NewGuid().ToString(),
                    TenantId = tenant.Id,
                    PropertyId = property.Id,
                    Title = "No Hot Water",
                    Description = "The water heater appears to be broken. There's no hot water coming from any faucet. This needs immediate attention.",
                    Priority = MaintenancePriority.Emergency,
                    Status = MaintenanceStatus.Pending,
                    CreatedAt = today,
                    UpdatedAt = today
                },
                // Today - Pending
                new MaintenanceRequest
                {
                    Id = Guid.NewGuid().ToString(),
                    TenantId = tenant.Id,
                    PropertyId = property.Id,
                    Title = "AC Not Cooling Properly",
                    Description = "The air conditioning unit is running but not cooling the apartment effectively. Room temperature stays around 78°F even when set to 68°F.",
                    Priority = MaintenancePriority.High,
                    Status = MaintenanceStatus.Pending,
                    CreatedAt = today,
                    UpdatedAt = today
                }
            };

            foreach (var request in maintenanceRequests)
            {
                await _dataService.CreateMaintenanceRequestAsync(request);
            }
        }
    }
}