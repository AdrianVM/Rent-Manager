using FluentAssertions;
using RentManager.API.Models;
using RentManager.API.Services;
using RentManager.Tests.Helpers;

namespace RentManager.Tests
{
    public class BasicTests
    {
        [Fact]
        public void CreateTestUser_ShouldReturnValidUser()
        {
            // Arrange & Act
            var user = TestDataHelper.CreateTestUser();

            // Assert
            user.Should().NotBeNull();
            user.Id.Should().NotBeNullOrEmpty();
            user.Email.Should().NotBeNullOrEmpty();
            user.Name.Should().NotBeNullOrEmpty();
            user.IsActive.Should().BeTrue();
        }

        [Fact]
        public void CreateTestProperty_ShouldReturnValidProperty()
        {
            // Arrange & Act
            var property = TestDataHelper.CreateTestProperty();

            // Assert
            property.Should().NotBeNull();
            property.Name.Should().NotBeNullOrEmpty();
            property.Address.Should().NotBeNullOrEmpty();
            property.RentAmount.Should().BeGreaterThan(0);
        }

        [Fact]
        public void CreateTestTenant_ShouldReturnValidTenant()
        {
            // Arrange & Act
            var tenant = TestDataHelper.CreateTestTenant();

            // Assert
            tenant.Should().NotBeNull();
            tenant.Name.Should().NotBeNullOrEmpty();
            tenant.Email.Should().NotBeNullOrEmpty();
            tenant.RentAmount.Should().BeGreaterThan(0);
        }

        [Fact]
        public void CreateTestPayment_ShouldReturnValidPayment()
        {
            // Arrange & Act
            var payment = TestDataHelper.CreateTestPayment();

            // Assert
            payment.Should().NotBeNull();
            payment.TenantId.Should().NotBeNullOrEmpty();
            payment.Amount.Should().BeGreaterThan(0);
            payment.Status.Should().Be(PaymentStatus.Completed);
        }

        [Fact]
        public async Task InMemoryDataService_ShouldCreateProperty()
        {
            // Arrange
            var dataService = new InMemoryDataService();
            var user = TestDataHelper.CreateTestUser("test-user", UserRole.Admin);
            var property = TestDataHelper.CreateTestProperty();
            property.Id = string.Empty; // New property

            // Act
            var result = await dataService.CreatePropertyAsync(property, user);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().NotBeNullOrEmpty();
            result.Name.Should().Be(property.Name);
        }

        [Fact]
        public async Task InMemoryDataService_ShouldCreateTenant()
        {
            // Arrange
            var dataService = new InMemoryDataService();
            var user = TestDataHelper.CreateTestUser("test-user", UserRole.Admin);
            var tenant = TestDataHelper.CreateTestTenant();
            tenant.Id = string.Empty; // New tenant

            // Act
            var result = await dataService.CreateTenantAsync(tenant, user);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().NotBeNullOrEmpty();
            result.Name.Should().Be(tenant.Name);
        }

        [Fact]
        public async Task InMemoryDataService_ShouldGetDashboardStats()
        {
            // Arrange
            var dataService = new InMemoryDataService();
            var user = TestDataHelper.CreateTestUser("test-user", UserRole.Admin);

            // Act
            var result = await dataService.GetDashboardStatsAsync(user);

            // Assert
            result.Should().NotBeNull();
            result.TotalProperties.Should().BeGreaterThanOrEqualTo(0);
            result.ActiveTenants.Should().BeGreaterThanOrEqualTo(0);
            result.TotalMonthlyRent.Should().BeGreaterThanOrEqualTo(0);
        }

        [Fact]
        public void UserRole_ShouldHaveCorrectValues()
        {
            // Act & Assert
            UserRole.Admin.Should().Be(UserRole.Admin);
            UserRole.PropertyOwner.Should().Be(UserRole.PropertyOwner);
            UserRole.Renter.Should().Be(UserRole.Renter);
        }

        [Fact]
        public void PropertyType_ShouldHaveCorrectValues()
        {
            // Act & Assert
            PropertyType.Apartment.Should().Be(PropertyType.Apartment);
            PropertyType.House.Should().Be(PropertyType.House);
            PropertyType.Condo.Should().Be(PropertyType.Condo);
        }

        [Fact]
        public void PaymentStatus_ShouldHaveCorrectValues()
        {
            // Act & Assert
            PaymentStatus.Completed.Should().Be(PaymentStatus.Completed);
            PaymentStatus.Pending.Should().Be(PaymentStatus.Pending);
            PaymentStatus.Failed.Should().Be(PaymentStatus.Failed);
        }
    }
}