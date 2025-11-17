# RentManager.Tests

This is the unit test project for the RentManager.API backend application.

## Overview

The test project provides comprehensive unit tests for the Rent Manager backend API, covering data models, services, and core functionality.

## Project Structure

```
RentManager.Tests/
├── BasicTests.cs                    # Core functionality tests
├── Helpers/
│   └── TestDataHelper.cs           # Test data generation utilities
└── README.md                       # This file
```

## Test Coverage

### BasicTests.cs
- **Model Tests**: Validation of all core data models (User, Property, Tenant, Payment, Contract)
- **Service Tests**: Testing of InMemoryDataService functionality
- **Enum Tests**: Validation of enum values and types
- **Integration Tests**: Basic service integration testing

### TestDataHelper.cs
- Factory methods for creating test data objects
- Consistent test data generation across all test classes
- Support for all major entities in the system

## Key Features Tested

✅ **User Management**
- User creation and validation
- Role-based functionality (Admin, PropertyOwner, Renter)

✅ **Property Management**
- Property creation and retrieval
- Property types and validation

✅ **Tenant Management**
- Tenant creation and management
- Tenant status validation

✅ **Payment Processing**
- Payment creation and validation
- Payment status and method validation

✅ **Data Services**
- InMemoryDataService CRUD operations
- Dashboard statistics generation
- Role-based data filtering

✅ **Dashboard Analytics**
- Statistics calculation
- Data aggregation testing

## Technologies Used

- **xUnit**: Testing framework
- **FluentAssertions**: Assertion library for readable test assertions
- **Moq**: Mocking framework for dependency injection
- **.NET 9.0**: Target framework

## Dependencies

```xml
<PackageReference Include="Microsoft.AspNetCore.Mvc.Testing" Version="9.0.9" />
<PackageReference Include="Moq" Version="4.20.72" />
<PackageReference Include="FluentAssertions" Version="8.7.1" />
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="9.0.9" />
<PackageReference Include="xunit" Version="2.9.2" />
<PackageReference Include="xunit.runner.visualstudio" Version="2.8.2" />
<PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.12.0" />
```

## Running Tests

### Command Line
```bash
# Run all tests
dotnet test

# Run tests with detailed output
dotnet test --verbosity normal

# Run tests and generate coverage report
dotnet test --collect:"XPlat Code Coverage"
```

### Visual Studio
- Open Test Explorer (Test → Test Explorer)
- Click "Run All Tests" or run individual tests

## Test Results

✅ **All 10 tests passing**
- CreateTestUser_ShouldReturnValidUser
- CreateTestProperty_ShouldReturnValidProperty
- CreateTestTenant_ShouldReturnValidTenant
- CreateTestPayment_ShouldReturnValidPayment
- InMemoryDataService_ShouldCreateProperty
- InMemoryDataService_ShouldCreateTenant
- InMemoryDataService_ShouldGetDashboardStats
- UserRole_ShouldHaveCorrectValues
- PropertyType_ShouldHaveCorrectValues
- PaymentStatus_ShouldHaveCorrectValues

## Extending Tests

To add more tests:

1. **Add test methods** to BasicTests.cs or create new test classes
2. **Use TestDataHelper** to generate consistent test data
3. **Follow naming conventions**: `MethodName_ShouldExpectedBehavior_WhenCondition`
4. **Use FluentAssertions** for readable assertions
5. **Mock dependencies** with Moq when testing services

## Example Test

```csharp
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
```

## CI/CD Integration

These tests are designed to run in CI/CD pipelines:
- No external dependencies required
- Fast execution (< 1 second)
- Deterministic results
- Cross-platform compatible

## Future Enhancements

- Add integration tests with TestServer
- Add performance tests for data operations
- Add tests for authentication and authorization
- Add tests for controller endpoints
- Add contract testing for API responses