using FluentAssertions;
using RentManager.API.Models;
using RentManager.API.Services;

namespace RentManager.Tests
{
    public class TenantTypeTests
    {
        #region Person Tenant Tests

        [Fact]
        public void PersonTenant_WithValidDetails_ShouldComputeNameCorrectly()
        {
            // Arrange
            var tenant = new Tenant
            {
                Id = "test-1",
                TenantType = TenantType.Person,
                Email = "john.doe@example.com",
                Person = new Person { Id = Guid.NewGuid().ToString(),
                    FirstName = "John",
                    LastName = "Doe"
                },
            };

            // Act
            var name = tenant.Name;

            // Assert
            name.Should().Be("John Doe");
        }

        [Fact]
        public void PersonTenant_WithOnlyFirstName_ShouldComputeNameCorrectly()
        {
            // Arrange
            var tenant = new Tenant
            {
                Id = "test-1",
                TenantType = TenantType.Person,
                Email = "john@example.com",
                Person = new Person { Id = Guid.NewGuid().ToString(),
                    FirstName = "John",
                    LastName = ""
                },
            };

            // Act
            var name = tenant.Name;

            // Assert
            name.Should().Be("John");
        }

        [Fact]
        public void PersonTenant_WithOnlyLastName_ShouldComputeNameCorrectly()
        {
            // Arrange
            var tenant = new Tenant
            {
                Id = "test-1",
                TenantType = TenantType.Person,
                Email = "doe@example.com",
                Person = new Person { Id = Guid.NewGuid().ToString(),
                    FirstName = "",
                    LastName = "Doe"
                },
            };

            // Act
            var name = tenant.Name;

            // Assert
            name.Should().Be("Doe");
        }

        [Fact]
        public void PersonTenant_WithNullPersonDetails_ShouldReturnUnknown()
        {
            // Arrange
            var tenant = new Tenant
            {
                Id = "test-1",
                TenantType = TenantType.Person,
                Email = "test@example.com",
                Person = null
            };

            // Act
            var name = tenant.Name;

            // Assert
            name.Should().Be("Unknown");
        }

        [Fact]
        public void PersonTenant_WithEmptyNames_ShouldReturnUnknown()
        {
            // Arrange
            var tenant = new Tenant
            {
                Id = "test-1",
                TenantType = TenantType.Person,
                Email = "test@example.com",
                Person = new Person { Id = Guid.NewGuid().ToString(),
                    FirstName = "",
                    LastName = ""
                },
            };

            // Act
            var name = tenant.Name;

            // Assert
            name.Should().Be("Unknown");
        }

        [Fact]
        public void PersonTenant_WithWhitespaceNames_ShouldTrimCorrectly()
        {
            // Arrange
            var tenant = new Tenant
            {
                Id = "test-1",
                TenantType = TenantType.Person,
                Email = "test@example.com",
                Person = new Person { Id = Guid.NewGuid().ToString(),
                    FirstName = "  John  ",
                    LastName = "  Doe  "
                },
            };

            // Act
            var name = tenant.Name;

            // Assert
            name.Should().Be("John Doe");
        }

        [Fact]
        public void PersonTenant_WithAllDetails_ShouldHaveValidEmergencyContact()
        {
            // Arrange
            var tenant = new Tenant
            {
                Id = "test-1",
                TenantType = TenantType.Person,
                Email = "john.doe@example.com",
                Person = new Person { Id = Guid.NewGuid().ToString(),
                    FirstName = "John",
                    LastName = "Doe",
                    DateOfBirth = new DateTime(1985, 5, 15),
                    IdNumber = "123-45-6789",
                    Nationality = "American",
                    Occupation = "Engineer" },
                EmergencyContactName = "Jane Doe",
                EmergencyContactPhone = "+1234567890",
                EmergencyContactRelation = "Spouse"
            };

            // Assert
            tenant.Person.Should().NotBeNull();
            tenant.Person.FirstName.Should().Be("John");
            tenant.Person.LastName.Should().Be("Doe");
            tenant.EmergencyContactName.Should().Be("Jane Doe");
            tenant.EmergencyContactPhone.Should().Be("+1234567890");
            tenant.EmergencyContactRelation.Should().Be("Spouse");
        }

        #endregion

        #region Company Tenant Tests

        [Fact]
        public void CompanyTenant_WithValidDetails_ShouldComputeNameCorrectly()
        {
            // Arrange
            var tenant = new Tenant
            {
                Id = "test-1",
                TenantType = TenantType.Company,
                Email = "contact@techcorp.com",
                Company = new Company
                {
                    Id = Guid.NewGuid().ToString(),
                    CompanyName = "TechCorp Solutions Inc"
                }
            };

            // Act
            var name = tenant.Name;

            // Assert
            name.Should().Be("TechCorp Solutions Inc");
        }

        [Fact]
        public void CompanyTenant_WithNullCompany_ShouldReturnUnknown()
        {
            // Arrange
            var tenant = new Tenant
            {
                Id = "test-1",
                TenantType = TenantType.Company,
                Email = "contact@company.com",
                Company = null
            };

            // Act
            var name = tenant.Name;

            // Assert
            name.Should().Be("Unknown");
        }

        [Fact]
        public void CompanyTenant_WithEmptyCompanyName_ShouldReturnUnknown()
        {
            // Arrange
            var tenant = new Tenant
            {
                Id = "test-1",
                TenantType = TenantType.Company,
                Email = "contact@company.com",
                Company = new Company
                {
                    Id = Guid.NewGuid().ToString(),
                    CompanyName = ""
                }
            };

            // Act
            var name = tenant.Name;

            // Assert
            name.Should().Be("Unknown");
        }

        [Fact]
        public void CompanyTenant_WithAllDetails_ShouldHaveValidContactPerson()
        {
            // Arrange
            var tenant = new Tenant
            {
                Id = "test-1",
                TenantType = TenantType.Company,
                Email = "contact@techcorp.com",
                Company = new Company
                {
                    Id = Guid.NewGuid().ToString(),
                    CompanyName = "TechCorp Solutions",
                    TaxId = "12-3456789",
                    RegistrationNumber = "REG-2020-12345",
                    LegalForm = "Corporation",
                    Industry = "Technology",
                    ContactPersonName = "John Smith",
                    ContactPersonTitle = "CFO",
                    ContactPersonEmail = "john.smith@techcorp.com",
                    ContactPersonPhone = "+1234567890",
                    BillingAddress = "123 Business St, City, State 12345"
                }
            };

            // Assert
            tenant.Company.Should().NotBeNull();
            tenant.Company.CompanyName.Should().Be("TechCorp Solutions");
            tenant.Company.TaxId.Should().Be("12-3456789");
            tenant.Company.ContactPersonName.Should().Be("John Smith");
            tenant.Company.ContactPersonTitle.Should().Be("CFO");
            tenant.Company.BillingAddress.Should().Be("123 Business St, City, State 12345");
        }

        [Fact]
        public void CompanyTenant_WithNullOptionalFields_ShouldBeValid()
        {
            // Arrange
            var tenant = new Tenant
            {
                Id = "test-1",
                TenantType = TenantType.Company,
                Email = "contact@company.com",
                Company = new Company
                {
                    Id = Guid.NewGuid().ToString(),
                    CompanyName = "Simple Company",
                    TaxId = null,
                    RegistrationNumber = null,
                    LegalForm = null,
                    Industry = null
                }
            };

            // Assert
            tenant.Company.Should().NotBeNull();
            tenant.Company.CompanyName.Should().Be("Simple Company");
            tenant.Company.TaxId.Should().BeNull();
            tenant.Company.RegistrationNumber.Should().BeNull();
        }

        #endregion

        #region Tenant Type Enum Tests

        [Fact]
        public void TenantType_ShouldHavePersonValue()
        {
            // Act & Assert
            TenantType.Person.Should().Be(TenantType.Person);
        }

        [Fact]
        public void TenantType_ShouldHaveCompanyValue()
        {
            // Act & Assert
            TenantType.Company.Should().Be(TenantType.Company);
        }

        [Fact]
        public void Tenant_DefaultTenantType_ShouldBePerson()
        {
            // Arrange & Act
            var tenant = new Tenant
            {
                Id = "test-1",
                Email = "test@example.com"
            };

            // Assert
            tenant.TenantType.Should().Be(TenantType.Person);
        }

        #endregion

        #region Data Service Tests

        [Fact]
        public async Task DataService_ShouldCreatePersonTenant()
        {
            // Arrange
            var dataService = new InMemoryDataService();
            var tenant = new Tenant
            {
                TenantType = TenantType.Person,
                Email = "john.doe@example.com",
                Phone = "+1234567890",
                PropertyId = "prop-1",
                RentAmount = 1500,
                Person = new Person { Id = Guid.NewGuid().ToString(),
                    FirstName = "John",
                    LastName = "Doe"
                },
            };

            // Act
            var result = await dataService.CreateTenantAsync(tenant);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().NotBeNullOrEmpty();
            result.TenantType.Should().Be(TenantType.Person);
            result.Person.Should().NotBeNull();
            result.Person.FirstName.Should().Be("John");
            result.Name.Should().Be("John Doe");
        }

        [Fact]
        public async Task DataService_ShouldCreateCompanyTenant()
        {
            // Arrange
            var dataService = new InMemoryDataService();
            var tenant = new Tenant
            {
                TenantType = TenantType.Company,
                Email = "contact@techcorp.com",
                Phone = "+1234567890",
                PropertyId = "prop-1",
                RentAmount = 5000,
                Company = new Company
                {
                    Id = Guid.NewGuid().ToString(),
                    CompanyName = "TechCorp Solutions",
                    TaxId = "12-3456789"
                }
            };

            // Act
            var result = await dataService.CreateTenantAsync(tenant);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().NotBeNullOrEmpty();
            result.TenantType.Should().Be(TenantType.Company);
            result.Company.Should().NotBeNull();
            result.Company.CompanyName.Should().Be("TechCorp Solutions");
            result.Name.Should().Be("TechCorp Solutions");
        }

        [Fact]
        public async Task DataService_ShouldUpdatePersonTenantDetails()
        {
            // Arrange
            var dataService = new InMemoryDataService();
            var tenant = new Tenant
            {
                TenantType = TenantType.Person,
                Email = "john.doe@example.com",
                PropertyId = "prop-1",
                RentAmount = 1500,
                Person = new Person { Id = Guid.NewGuid().ToString(),
                    FirstName = "John",
                    LastName = "Doe"
                },
            };

            var created = await dataService.CreateTenantAsync(tenant);

            // Act
            created.Person.Should().NotBeNull();
            created.Person!.FirstName = "Jane";
            created.Person.Occupation = "Doctor";
            var updated = await dataService.UpdateTenantAsync(created.Id, created);

            // Assert
            updated.Should().NotBeNull();
            updated.Person.Should().NotBeNull();
            updated.Person!.FirstName.Should().Be("Jane");
            updated.Person.Occupation.Should().Be("Doctor");
            updated.Name.Should().Be("Jane Doe");
        }

        [Fact]
        public async Task DataService_ShouldUpdateCompanyTenantDetails()
        {
            // Arrange
            var dataService = new InMemoryDataService();
            var tenant = new Tenant
            {
                TenantType = TenantType.Company,
                Email = "contact@techcorp.com",
                PropertyId = "prop-1",
                RentAmount = 5000,
                Company = new Company
                {
                    Id = Guid.NewGuid().ToString(),
                    CompanyName = "TechCorp Solutions",
                    TaxId = "12-3456789"
                }
            };

            var created = await dataService.CreateTenantAsync(tenant);

            // Act
            created.Company.Should().NotBeNull();
            created.Company!.CompanyName = "TechCorp Industries";
            created.Company.ContactPersonName = "John Smith";
            var updated = await dataService.UpdateTenantAsync(created.Id, created);

            // Assert
            updated.Should().NotBeNull();
            updated.Company.Should().NotBeNull();
            updated.Company!.CompanyName.Should().Be("TechCorp Industries");
            updated.Company.ContactPersonName.Should().Be("John Smith");
            updated.Name.Should().Be("TechCorp Industries");
        }

        [Fact]
        public async Task DataService_ShouldHandleMixedTenantTypes()
        {
            // Arrange
            var dataService = new InMemoryDataService();

            var personTenant = new Tenant
            {
                TenantType = TenantType.Person,
                Email = "person@example.com",
                PropertyId = "prop-1",
                RentAmount = 1500,
                Person = new Person { Id = Guid.NewGuid().ToString(), FirstName = "John", LastName = "Doe" },
            };

            var companyTenant = new Tenant
            {
                TenantType = TenantType.Company,
                Email = "company@example.com",
                PropertyId = "prop-2",
                RentAmount = 5000,
                Company = new Company { Id = Guid.NewGuid().ToString(), CompanyName = "TechCorp" }
            };

            // Act
            var person = await dataService.CreateTenantAsync(personTenant);
            var company = await dataService.CreateTenantAsync(companyTenant);
            var allTenants = await dataService.GetTenantsAsync();

            // Assert
            allTenants.Should().HaveCount(2);
            allTenants.Should().Contain(t => t.TenantType == TenantType.Person);
            allTenants.Should().Contain(t => t.TenantType == TenantType.Company);
            allTenants.First(t => t.TenantType == TenantType.Person).Name.Should().Be("John Doe");
            allTenants.First(t => t.TenantType == TenantType.Company).Name.Should().Be("TechCorp");
        }

        #endregion

        #region Edge Cases

        [Fact]
        public void Tenant_CanSwitchFromPersonToCompany()
        {
            // Arrange
            var tenant = new Tenant
            {
                Id = "test-1",
                TenantType = TenantType.Person,
                Email = "test@example.com",
                Person = new Person { Id = Guid.NewGuid().ToString(),
                    FirstName = "John",
                    LastName = "Doe"
                },
            };

            // Act
            tenant.TenantType = TenantType.Company;
            tenant.Person = null;
            tenant.Company = new Company
            {
                Id = Guid.NewGuid().ToString(),
                CompanyName = "Doe Enterprises"
            };

            // Assert
            tenant.TenantType.Should().Be(TenantType.Company);
            tenant.Name.Should().Be("Doe Enterprises");
        }

        [Fact]
        public void Tenant_WithBothDetailsSet_ShouldUseCorrectType()
        {
            // Arrange
            var tenant = new Tenant
            {
                Id = "test-1",
                TenantType = TenantType.Person,
                Email = "test@example.com",
                Person = new Person { Id = Guid.NewGuid().ToString(), FirstName = "John", LastName = "Doe" },
                Company = new Company { Id = Guid.NewGuid().ToString(), CompanyName = "TechCorp" } // This shouldn't be used
            };

            // Act
            var name = tenant.Name;

            // Assert - Should use PersonDetails because TenantType is Person
            name.Should().Be("John Doe");
        }

        [Fact]
        public void PersonTenant_WithSpecialCharactersInName_ShouldHandle()
        {
            // Arrange
            var tenant = new Tenant
            {
                Id = "test-1",
                TenantType = TenantType.Person,
                Email = "test@example.com",
                Person = new Person { Id = Guid.NewGuid().ToString(),
                    FirstName = "María",
                    LastName = "O'Brien-Smith"
                },
            };

            // Act
            var name = tenant.Name;

            // Assert
            name.Should().Be("María O'Brien-Smith");
        }

        [Fact]
        public void CompanyTenant_WithSpecialCharactersInName_ShouldHandle()
        {
            // Arrange
            var tenant = new Tenant
            {
                Id = "test-1",
                TenantType = TenantType.Company,
                Email = "test@example.com",
                Company = new Company
                {
                    Id = Guid.NewGuid().ToString(),
                    CompanyName = "Tech & Co., Ltd."
                }
            };

            // Act
            var name = tenant.Name;

            // Assert
            name.Should().Be("Tech & Co., Ltd.");
        }

        [Fact]
        public void PersonTenant_WithVeryLongName_ShouldNotTruncate()
        {
            // Arrange
            var tenant = new Tenant
            {
                Id = "test-1",
                TenantType = TenantType.Person,
                Email = "test@example.com",
                Person = new Person { Id = Guid.NewGuid().ToString(),
                    FirstName = "VeryLongFirstNameThatExceedsNormalLength",
                    LastName = "VeryLongLastNameThatExceedsNormalLength"
                },
            };

            // Act
            var name = tenant.Name;

            // Assert
            name.Should().Be("VeryLongFirstNameThatExceedsNormalLength VeryLongLastNameThatExceedsNormalLength");
            name.Length.Should().BeGreaterThan(50);
        }

        [Fact]
        public void PersonTenant_DateOfBirth_ShouldHandlePastDates()
        {
            // Arrange
            var pastDate = new DateTime(1950, 1, 1);
            var tenant = new Tenant
            {
                Id = "test-1",
                TenantType = TenantType.Person,
                Email = "test@example.com",
                Person = new Person { Id = Guid.NewGuid().ToString(),
                    FirstName = "John",
                    LastName = "Doe",
                    DateOfBirth = pastDate
                },
            };

            // Assert
            tenant.Person.DateOfBirth.Should().Be(pastDate);
            tenant.Person.DateOfBirth.Value.Year.Should().Be(1950);
        }

        [Fact]
        public void PersonTenant_DateOfBirth_CanBeNull()
        {
            // Arrange
            var tenant = new Tenant
            {
                Id = "test-1",
                TenantType = TenantType.Person,
                Email = "test@example.com",
                Person = new Person { Id = Guid.NewGuid().ToString(),
                    FirstName = "John",
                    LastName = "Doe",
                    DateOfBirth = null
                },
            };

            // Assert
            tenant.Person.DateOfBirth.Should().BeNull();
        }

        #endregion
    }
}
