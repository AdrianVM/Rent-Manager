using RentManager.API.Models;

namespace RentManager.Tests.Helpers
{
    public static class TestDataHelper
    {
        public static User CreateTestUser(string id = "test-user-1", string roleName = Role.Renter)
        {
            var user = new User
            {
                Id = id,
                Email = $"test{id}@example.com",
                Name = $"Test User {id}",
                PasswordHash = "hashed-password",
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                UpdatedAt = DateTime.UtcNow
            };

            // Add role
            var role = new API.Models.Role { Id = GetRoleId(roleName), Name = roleName };
            user.UserRoles.Add(new UserRole
            {
                UserId = id,
                RoleId = role.Id,
                Role = role,
                AssignedAt = DateTime.UtcNow
            });

            return user;
        }

        private static int GetRoleId(string roleName)
        {
            return roleName switch
            {
                Role.Admin => 1,
                Role.PropertyOwner => 2,
                Role.Renter => 3,
                _ => 3
            };
        }

        public static Property CreateTestProperty(string id = "test-property-1")
        {
            return new Property
            {
                Id = id,
                Name = $"Test Property {id}",
                Address = $"123 Test Street {id}",
                Type = PropertyType.Apartment,
                Bedrooms = 2,
                Bathrooms = 1.5m,
                RentAmount = 1500.00m,
                Description = "A nice test property",
                SquareFootage = 1000,
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                UpdatedAt = DateTime.UtcNow
            };
        }

        public static List<Property> CreateTestProperties(int count = 3)
        {
            var properties = new List<Property>();
            for (int i = 1; i <= count; i++)
            {
                properties.Add(CreateTestProperty($"test-property-{i}"));
            }
            return properties;
        }

        public static UserRegistrationRequest CreateTestRegistrationRequest()
        {
            return new UserRegistrationRequest
            {
                Email = "newuser@example.com",
                Name = "New Test User",
                Password = "testpassword123",
                Roles = new List<string> { Role.Renter }
            };
        }

        public static UserLoginRequest CreateTestLoginRequest()
        {
            return new UserLoginRequest
            {
                Email = "test@example.com",
                Password = "testpassword123"
            };
        }

        public static Payment CreateTestPayment(string id = "test-payment-1")
        {
            return new Payment
            {
                Id = id,
                TenantId = "test-tenant-1",
                Amount = 1500.00m,
                Date = DateTime.UtcNow,
                Method = PaymentMethod.BankTransfer,
                Notes = "Monthly rent payment",
                Status = PaymentStatus.Completed,
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                UpdatedAt = DateTime.UtcNow
            };
        }

        public static Tenant CreateTestTenant(string id = "test-tenant-1")
        {
            return new Tenant
            {
                Id = id,
                TenantType = TenantType.Person,
                Email = $"tenant{id}@example.com",
                Phone = "+1234567890",
                PropertyId = "test-property-1",
                LeaseStart = DateTime.UtcNow.AddDays(-30),
                LeaseEnd = DateTime.UtcNow.AddDays(335),
                RentAmount = 1500.00m,
                Deposit = 1500.00m,
                Status = TenantStatus.Active,
                PersonDetails = new PersonDetails
                {
                    FirstName = "Test",
                    LastName = $"Tenant {id}",
                    DateOfBirth = DateTime.UtcNow.AddYears(-30),
                    Nationality = "American"
                },
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                UpdatedAt = DateTime.UtcNow
            };
        }

        public static Contract CreateTestContract(string id = "test-contract-1")
        {
            return new Contract
            {
                Id = id,
                TenantId = "test-tenant-1",
                PropertyId = "test-property-1",
                FileName = "test-contract.pdf",
                FileContentBase64 = Convert.ToBase64String(new byte[] { 1, 2, 3, 4, 5 }),
                MimeType = "application/pdf",
                FileSizeBytes = 5,
                UploadedAt = DateTime.UtcNow,
                Status = ContractStatus.Signed,
                Notes = "Test contract"
            };
        }
    }
}