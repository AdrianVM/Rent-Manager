using Microsoft.EntityFrameworkCore;
using RentManager.API.Data;
using RentManager.API.Models;

namespace RentManager.API.Services
{
    public class SeedDataService
    {
        private readonly IDataService _dataService;
        private readonly IUnitOfWork _context;

        public SeedDataService(IDataService dataService, IUnitOfWork context)
        {
            _dataService = dataService;
            _context = context;
        }

        public async Task SeedAllDataAsync(string userEmail)
        {
            // Create the main user with multiple roles
            var mainUser = await CreateMainUserAsync(userEmail);

            // Create additional users
            var additionalUsers = await CreateAdditionalUsersAsync();

            // Seed data in order (properties first, then property owners, then tenants, then payments, then maintenance requests)
            var properties = await SeedPropertiesAsync();
            await SeedPropertyOwnersAsync(properties, mainUser);
            var tenants = await SeedTenantsAsync(properties, mainUser, additionalUsers);
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
                        DateOfBirth = DateTime.SpecifyKind(new DateTime(1990, 1, 1), DateTimeKind.Utc),
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
                    DateOfBirth = DateTime.SpecifyKind(new DateTime(1990, 1, 1), DateTimeKind.Utc),
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
            var utcNow = DateTimeOffset.UtcNow;
            var userRoles = new List<UserRole>
            {
                new UserRole { UserId = existingUser.Id, RoleId = adminRole.Id, AssignedAt = utcNow },
                new UserRole { UserId = existingUser.Id, RoleId = propertyOwnerRole.Id, AssignedAt = utcNow },
                new UserRole { UserId = existingUser.Id, RoleId = renterRole.Id, AssignedAt = utcNow }
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

        private async Task<List<User>> CreateAdditionalUsersAsync()
        {
            var additionalUsers = new List<User>();

            // Get roles from database
            var propertyOwnerRole = await _context.Roles.FirstAsync(r => r.Name == Role.PropertyOwner);
            var renterRole = await _context.Roles.FirstAsync(r => r.Name == Role.Renter);

            // Define additional users with their details
            var userDetails = new[]
            {
                new { Email = "john.smith@example.com", FirstName = "John", LastName = "Smith", Role = renterRole },
                new { Email = "sarah.johnson@example.com", FirstName = "Sarah", LastName = "Johnson", Role = renterRole },
                new { Email = "michael.brown@example.com", FirstName = "Michael", LastName = "Brown", Role = renterRole },
                new { Email = "emily.davis@example.com", FirstName = "Emily", LastName = "Davis", Role = renterRole },
                new { Email = "david.wilson@example.com", FirstName = "David", LastName = "Wilson", Role = renterRole },
                new { Email = "lisa.anderson@example.com", FirstName = "Lisa", LastName = "Anderson", Role = propertyOwnerRole },
                new { Email = "james.taylor@example.com", FirstName = "James", LastName = "Taylor", Role = renterRole }
            };

            foreach (var userDetail in userDetails)
            {
                // Check if user already exists
                var existingUser = await _context.Users
                    .Include(u => u.UserRoles)
                        .ThenInclude(ur => ur.Role)
                    .Include(u => u.Person)
                    .FirstOrDefaultAsync(u => u.Email == userDetail.Email);

                if (existingUser != null)
                {
                    additionalUsers.Add(existingUser);
                    continue; // Skip if user already exists
                }

                // Create Person record
                var person = new Person
                {
                    Id = Guid.NewGuid().ToString(),
                    FirstName = userDetail.FirstName,
                    MiddleName = string.Empty,
                    LastName = userDetail.LastName,
                    DateOfBirth = DateTime.SpecifyKind(new DateTime(1985 + additionalUsers.Count, 5, 15), DateTimeKind.Utc),
                    Nationality = "US",
                    Occupation = userDetail.Role.Name == Role.Renter ? "Professional" : "Property Manager",
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                };

                _context.Persons.Add(person);
                await _context.SaveChangesAsync();

                // Create User record
                var user = new User
                {
                    Id = Guid.NewGuid().ToString(),
                    Email = userDetail.Email,
                    PasswordHash = "not-used-zitadel-auth",
                    IsActive = true,
                    PersonId = person.Id,
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                // Assign role
                var userRole = new UserRole
                {
                    UserId = user.Id,
                    RoleId = userDetail.Role.Id,
                    AssignedAt = DateTimeOffset.UtcNow
                };

                _context.UserRoles.Add(userRole);
                await _context.SaveChangesAsync();

                // Reload user with all navigation properties
                var loadedUser = await _context.Users
                    .Include(u => u.UserRoles)
                        .ThenInclude(ur => ur.Role)
                    .Include(u => u.Person)
                    .FirstAsync(u => u.Id == user.Id);

                additionalUsers.Add(loadedUser);
            }

            return additionalUsers;
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

        private async Task<List<Tenant>> SeedTenantsAsync(List<Property> properties, User mainUser, List<User> additionalUsers)
        {
            var tenants = new List<Tenant>();

            // Check if tenant for main user already exists
            var existingMainTenant = await _context.Tenants
                .FirstOrDefaultAsync(t => t.PersonId == mainUser.PersonId && t.PropertyId == properties[0].Id);

            if (existingMainTenant != null)
            {
                tenants.Add(existingMainTenant);
            }
            else
            {
                // Create tenant for the main user
                var mainTenant = new Tenant
                {
                    TenantType = TenantType.Person,
                    Email = mainUser.Email,
                    Phone = "+1 (555) 000-0000",
                    PersonId = mainUser.PersonId,
                    PropertyId = properties[0].Id, // Sunset Apartments
                    LeaseStart = new DateTimeOffset(2024, 1, 1, 0, 0, 0, TimeSpan.Zero).ToUniversalTime(),
                    LeaseEnd = new DateTimeOffset(2025, 12, 31, 0, 0, 0, TimeSpan.Zero).ToUniversalTime(),
                    RentAmount = properties[0].RentAmount,
                    Deposit = properties[0].RentAmount,
                    Status = TenantStatus.Active,
                    EmergencyContactName = "Emergency Contact",
                    EmergencyContactPhone = "+1 (555) 999-9999",
                    EmergencyContactRelation = "Family"
                };
                tenants.Add(await _dataService.CreateTenantAsync(mainTenant));
            }

            // Create tenants for additional users
            var tenantData = new[]
            {
            new { UserIndex = 0, PropertyIndex = 1, Phone = "+1 (555) 101-1001", LeaseStart = new DateTimeOffset(2024, 2, 1, 0, 0, 0, TimeSpan.Zero).ToUniversalTime(), LeaseEnd = new DateTimeOffset(2025, 1, 31, 0, 0, 0, TimeSpan.Zero).ToUniversalTime(), Status = TenantStatus.Active },
            new { UserIndex = 1, PropertyIndex = 2, Phone = "+1 (555) 102-1002", LeaseStart = new DateTimeOffset(2023, 6, 1, 0, 0, 0, TimeSpan.Zero).ToUniversalTime(), LeaseEnd = new DateTimeOffset(2026, 5, 31, 0, 0, 0, TimeSpan.Zero).ToUniversalTime(), Status = TenantStatus.Active },
            new { UserIndex = 2, PropertyIndex = 5, Phone = "+1 (555) 103-1003", LeaseStart = new DateTimeOffset(2024, 3, 1, 0, 0, 0, TimeSpan.Zero).ToUniversalTime(), LeaseEnd = new DateTimeOffset(2025, 2, 28, 0, 0, 0, TimeSpan.Zero).ToUniversalTime(), Status = TenantStatus.Active },
            new { UserIndex = 3, PropertyIndex = 6, Phone = "+1 (555) 104-1004", LeaseStart = new DateTimeOffset(2023, 9, 1, 0, 0, 0, TimeSpan.Zero).ToUniversalTime(), LeaseEnd = new DateTimeOffset(2024, 8, 31, 0, 0, 0, TimeSpan.Zero).ToUniversalTime(), Status = TenantStatus.Active },
            new { UserIndex = 4, PropertyIndex = 3, Phone = "+1 (555) 105-1005", LeaseStart = new DateTimeOffset(2023, 12, 1, 0, 0, 0, TimeSpan.Zero).ToUniversalTime(), LeaseEnd = new DateTimeOffset(2025, 11, 30, 0, 0, 0, TimeSpan.Zero).ToUniversalTime(), Status = TenantStatus.Active },
            new { UserIndex = 6, PropertyIndex = 4, Phone = "+1 (555) 107-1007", LeaseStart = new DateTimeOffset(2022, 1, 1, 0, 0, 0, TimeSpan.Zero).ToUniversalTime(), LeaseEnd = new DateTimeOffset(2024, 12, 31, 0, 0, 0, TimeSpan.Zero).ToUniversalTime(), Status = TenantStatus.Active }
        };

            foreach (var data in tenantData)
            {
                if (data.UserIndex >= additionalUsers.Count || data.PropertyIndex >= properties.Count)
                    continue;

                var user = additionalUsers[data.UserIndex];
                var property = properties[data.PropertyIndex];

                // Check if tenant already exists for this user and property
                var existingTenant = await _context.Tenants
                    .FirstOrDefaultAsync(t => t.PersonId == user.PersonId && t.PropertyId == property.Id);

                if (existingTenant != null)
                {
                    tenants.Add(existingTenant);
                    continue;
                }

                var tenant = new Tenant
                {
                    TenantType = TenantType.Person,
                    Email = user.Email,
                    Phone = data.Phone,
                    PersonId = user.PersonId,
                    PropertyId = property.Id,
                    LeaseStart = data.LeaseStart,
                    LeaseEnd = data.LeaseEnd,
                    RentAmount = property.RentAmount,
                    Deposit = property.RentAmount,
                    Status = data.Status,
                    EmergencyContactName = "Emergency Contact",
                    EmergencyContactPhone = "+1 (555) 999-9999",
                    EmergencyContactRelation = "Family"
                };

                tenants.Add(await _dataService.CreateTenantAsync(tenant));
            }

            return tenants;
        }

        private async Task SeedPaymentsAsync(List<Tenant> tenants)
        {
            var payments = new List<Payment>();
            var random = new Random(42); // Fixed seed for reproducibility
            var methods = new[] { PaymentMethod.BankTransfer, PaymentMethod.Check, PaymentMethod.Online, PaymentMethod.Cash };

            // Generate payment history for each tenant
            for (int i = 0; i < tenants.Count; i++)
            {
                var tenant = tenants[i];

                // Skip if tenant has no lease start date
                if (!tenant.LeaseStart.HasValue)
                    continue;

                var leaseStartDate = tenant.LeaseStart.Value;
                var currentDate = DateTimeOffset.UtcNow;

                // Calculate months between lease start and now (inclusive of current month)
                var monthsDiff = ((currentDate.Year - leaseStartDate.Year) * 12) + currentDate.Month - leaseStartDate.Month + 1;
                var paymentMonths = Math.Min(monthsDiff, 24); // Cap at 24 months for performance

                // Create payment history from lease start
                for (int monthOffset = 0; monthOffset < paymentMonths; monthOffset++)
                {
                    var paymentDate = leaseStartDate.AddMonths(monthOffset);

                    // Make payment date the 1st of the month
                    paymentDate = new DateTimeOffset(paymentDate.Year, paymentDate.Month, 1, 0, 0, 0, TimeSpan.Zero);

                    // Skip future payments
                    if (paymentDate > currentDate)
                        continue;

                    // Occasionally add late payments (10% chance)
                    if (random.Next(100) < 10)
                    {
                        paymentDate = paymentDate.AddDays(random.Next(5, 15));
                    }

                    // Most payments are completed (90%)
                    var status = random.Next(100) < 90 ? PaymentStatus.Completed : PaymentStatus.Pending;

                    // Occasionally create partial payments (5% chance)
                    var amount = tenant.RentAmount;
                    var isPartial = random.Next(100) < 5;
                    if (isPartial)
                    {
                        amount = tenant.RentAmount * (decimal)(0.4 + random.NextDouble() * 0.4); // 40-80% of rent
                    }

                    var payment = new Payment
                    {
                        TenantId = tenant.Id,
                        Amount = amount,
                        Date = paymentDate,
                        Method = methods[random.Next(methods.Length)],
                        Status = status,
                        ProcessedAt = status == PaymentStatus.Completed ? paymentDate : null,
                        Notes = isPartial
                            ? $"Partial {paymentDate.ToString("MMMM yyyy")} rent payment"
                            : $"{paymentDate.ToString("MMMM yyyy")} rent payment"
                    };

                    payments.Add(payment);
                }

                // Add some additional special case payments for variety
                if (i == 1 && paymentMonths > 2)
                {
                    // Add a late fee for tenant 1
                    var lateFeeDate = leaseStartDate.AddMonths(2).AddDays(10);
                    payments.Add(new Payment
                    {
                        TenantId = tenant.Id,
                        Amount = 50,
                        Date = lateFeeDate,
                        Method = PaymentMethod.Online,
                        Status = PaymentStatus.Completed,
                        ProcessedAt = lateFeeDate,
                        Notes = "Late payment fee"
                    });
                }

                if (i == 2 && paymentMonths > 3)
                {
                    // Add a maintenance fee payment
                    var petDepositDate = leaseStartDate.AddMonths(3).AddDays(5);
                    payments.Add(new Payment
                    {
                        TenantId = tenant.Id,
                        Amount = 150,
                        Date = petDepositDate,
                        Method = PaymentMethod.BankTransfer,
                        Status = PaymentStatus.Completed,
                        ProcessedAt = petDepositDate,
                        Notes = "Pet deposit"
                    });
                }

                if (i == 3 && paymentMonths > 1)
                {
                    // Add a pending payment for tenant 3
                    var lastMonth = currentDate.AddMonths(-1);
                    payments.Add(new Payment
                    {
                        TenantId = tenant.Id,
                        Amount = tenant.RentAmount,
                        Date = new DateTimeOffset(lastMonth.Year, lastMonth.Month, 5, 0, 0, 0, TimeSpan.Zero),
                        Method = PaymentMethod.Check,
                        Status = PaymentStatus.Pending,
                        Notes = $"{lastMonth.ToString("MMMM yyyy")} rent payment - check processing"
                    });
                }
            }

            // Save all payments
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
            var today = new DateTimeOffset(now.Year, now.Month, now.Day, 10, 30, 0, TimeSpan.Zero);
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

            // Add directly to context to preserve the CreatedAt dates
            _context.MaintenanceRequests.AddRange(maintenanceRequests);
            await _context.SaveChangesAsync();
        }
    }
}