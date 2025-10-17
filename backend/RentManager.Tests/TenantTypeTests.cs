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
                PersonDetails = new PersonDetails
                {
                    FirstName = "John",
                    LastName = "Doe"
                }
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
                PersonDetails = new PersonDetails
                {
                    FirstName = "John",
                    LastName = ""
                }
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
                PersonDetails = new PersonDetails
                {
                    FirstName = "",
                    LastName = "Doe"
                }
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
                PersonDetails = null
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
                PersonDetails = new PersonDetails
                {
                    FirstName = "",
                    LastName = ""
                }
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
                PersonDetails = new PersonDetails
                {
                    FirstName = "  John  ",
                    LastName = "  Doe  "
                }
            };

            // Act
            var name = tenant.Name;

            // Assert
            name.Should().Be("John     Doe");
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
                PersonDetails = new PersonDetails
                {
                    FirstName = "John",
                    LastName = "Doe",
                    DateOfBirth = new DateTime(1985, 5, 15),
                    IdNumber = "123-45-6789",
                    Nationality = "American",
                    Occupation = "Engineer",
                    EmergencyContactName = "Jane Doe",
                    EmergencyContactPhone = "+1234567890",
                    EmergencyContactRelation = "Spouse"
                }
            };

            // Assert
            tenant.PersonDetails.Should().NotBeNull();
            tenant.PersonDetails.FirstName.Should().Be("John");
            tenant.PersonDetails.LastName.Should().Be("Doe");
            tenant.PersonDetails.EmergencyContactName.Should().Be("Jane Doe");
            tenant.PersonDetails.EmergencyContactPhone.Should().Be("+1234567890");
            tenant.PersonDetails.EmergencyContactRelation.Should().Be("Spouse");
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
                CompanyDetails = new CompanyDetails
                {
                    CompanyName = "TechCorp Solutions Inc"
                }
            };

            // Act
            var name = tenant.Name;

            // Assert
            name.Should().Be("TechCorp Solutions Inc");
        }

        [Fact]
        public void CompanyTenant_WithNullCompanyDetails_ShouldReturnUnknown()
        {
            // Arrange
            var tenant = new Tenant
            {
                Id = "test-1",
                TenantType = TenantType.Company,
                Email = "contact@company.com",
                CompanyDetails = null
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
                CompanyDetails = new CompanyDetails
                {
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
                CompanyDetails = new CompanyDetails
                {
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
            tenant.CompanyDetails.Should().NotBeNull();
            tenant.CompanyDetails.CompanyName.Should().Be("TechCorp Solutions");
            tenant.CompanyDetails.TaxId.Should().Be("12-3456789");
            tenant.CompanyDetails.ContactPersonName.Should().Be("John Smith");
            tenant.CompanyDetails.ContactPersonTitle.Should().Be("CFO");
            tenant.CompanyDetails.BillingAddress.Should().Be("123 Business St, City, State 12345");
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
                CompanyDetails = new CompanyDetails
                {
                    CompanyName = "Simple Company",
                    TaxId = null,
                    RegistrationNumber = null,
                    LegalForm = null,
                    Industry = null
                }
            };

            // Assert
            tenant.CompanyDetails.Should().NotBeNull();
            tenant.CompanyDetails.CompanyName.Should().Be("Simple Company");
            tenant.CompanyDetails.TaxId.Should().BeNull();
            tenant.CompanyDetails.RegistrationNumber.Should().BeNull();
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
                PersonDetails = new PersonDetails
                {
                    FirstName = "John",
                    LastName = "Doe"
                }
            };

            // Act
            var result = await dataService.CreateTenantAsync(tenant);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().NotBeNullOrEmpty();
            result.TenantType.Should().Be(TenantType.Person);
            result.PersonDetails.Should().NotBeNull();
            result.PersonDetails.FirstName.Should().Be("John");
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
                CompanyDetails = new CompanyDetails
                {
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
            result.CompanyDetails.Should().NotBeNull();
            result.CompanyDetails.CompanyName.Should().Be("TechCorp Solutions");
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
                PersonDetails = new PersonDetails
                {
                    FirstName = "John",
                    LastName = "Doe"
                }
            };

            var created = await dataService.CreateTenantAsync(tenant);

            // Act
            created.PersonDetails.FirstName = "Jane";
            created.PersonDetails.Occupation = "Doctor";
            var updated = await dataService.UpdateTenantAsync(created.Id, created);

            // Assert
            updated.Should().NotBeNull();
            updated.PersonDetails.FirstName.Should().Be("Jane");
            updated.PersonDetails.Occupation.Should().Be("Doctor");
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
                CompanyDetails = new CompanyDetails
                {
                    CompanyName = "TechCorp Solutions",
                    TaxId = "12-3456789"
                }
            };

            var created = await dataService.CreateTenantAsync(tenant);

            // Act
            created.CompanyDetails.CompanyName = "TechCorp Industries";
            created.CompanyDetails.ContactPersonName = "John Smith";
            var updated = await dataService.UpdateTenantAsync(created.Id, created);

            // Assert
            updated.Should().NotBeNull();
            updated.CompanyDetails.CompanyName.Should().Be("TechCorp Industries");
            updated.CompanyDetails.ContactPersonName.Should().Be("John Smith");
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
                PersonDetails = new PersonDetails { FirstName = "John", LastName = "Doe" }
            };

            var companyTenant = new Tenant
            {
                TenantType = TenantType.Company,
                Email = "company@example.com",
                PropertyId = "prop-2",
                RentAmount = 5000,
                CompanyDetails = new CompanyDetails { CompanyName = "TechCorp" }
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
                PersonDetails = new PersonDetails
                {
                    FirstName = "John",
                    LastName = "Doe"
                }
            };

            // Act
            tenant.TenantType = TenantType.Company;
            tenant.PersonDetails = null;
            tenant.CompanyDetails = new CompanyDetails
            {
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
                PersonDetails = new PersonDetails { FirstName = "John", LastName = "Doe" },
                CompanyDetails = new CompanyDetails { CompanyName = "TechCorp" } // This shouldn't be used
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
                PersonDetails = new PersonDetails
                {
                    FirstName = "María",
                    LastName = "O'Brien-Smith"
                }
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
                CompanyDetails = new CompanyDetails
                {
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
                PersonDetails = new PersonDetails
                {
                    FirstName = "VeryLongFirstNameThatExceedsNormalLength",
                    LastName = "VeryLongLastNameThatExceedsNormalLength"
                }
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
                PersonDetails = new PersonDetails
                {
                    FirstName = "John",
                    LastName = "Doe",
                    DateOfBirth = pastDate
                }
            };

            // Assert
            tenant.PersonDetails.DateOfBirth.Should().Be(pastDate);
            tenant.PersonDetails.DateOfBirth.Value.Year.Should().Be(1950);
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
                PersonDetails = new PersonDetails
                {
                    FirstName = "John",
                    LastName = "Doe",
                    DateOfBirth = null
                }
            };

            // Assert
            tenant.PersonDetails.DateOfBirth.Should().BeNull();
        }

        #endregion
    }
}
