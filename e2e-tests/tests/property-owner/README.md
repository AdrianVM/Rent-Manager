# Property Owner E2E Tests

This directory contains end-to-end tests for property owner features.

## Test Files

### create-property.spec.ts

Comprehensive E2E tests for **User Story 2.1.1: Create Property**

#### Test Coverage

The test suite covers all acceptance criteria from the functional requirements:

**AC1: Basic Property Creation**
- ✅ Create property with required fields (name, address, type, rent amount)
- ✅ Verify property is linked to owner account
- ✅ Validate via both UI and API

**AC2: Residential Properties (Apartment/House)**
- ✅ Create apartment with bedrooms and bathrooms
- ✅ Create house with bedrooms and bathrooms
- ✅ Include square footage and description
- ✅ Verify residential-specific fields are saved correctly

**AC3: Parking Space Properties**
- ✅ Create parking space with all parking types:
  - Underground parking
  - Covered parking
  - Outdoor parking
  - Garage parking
- ✅ Verify parking type and space number are required and saved
- ✅ Validate parking-specific fields

**AC4: Timestamp Validation**
- ✅ Verify CreatedAt timestamp is automatically set
- ✅ Verify UpdatedAt timestamp is automatically set
- ✅ Confirm timestamps are within expected time range
- ✅ Verify UpdatedAt equals CreatedAt for new properties

**AC5: Validation Errors**
- ✅ Missing property name validation
- ✅ Missing address validation
- ✅ Invalid rent amount (negative) validation
- ✅ Invalid rent amount (zero) validation
- ✅ Missing space number for parking spaces validation
- ✅ Verify property is not created when validation fails

**Additional Tests**
- ✅ API-only property creation
- ✅ Dynamic form field visibility based on property type
- ✅ Create property with all optional fields
- ✅ Create multiple properties for same owner

#### Test Tags

Tests use the following tags for filtering:

- `@property-owner` - All property owner tests
- `@property-creation` - Property creation tests
- `@smoke` - Critical path smoke tests
- `@critical` - Critical business functionality
- `@api` - API-only tests (no UI interaction)

#### Running Tests

Run all property creation tests:
```bash
npm run test:property-owner
```

Run only smoke tests:
```bash
npx playwright test --grep @smoke
```

Run only critical tests:
```bash
npx playwright test --grep @critical
```

Run specific test file:
```bash
npx playwright test tests/property-owner/create-property.spec.ts
```

Run with UI mode for debugging:
```bash
npx playwright test tests/property-owner/create-property.spec.ts --ui
```

#### Test Structure

Each test follows the BDD (Behavior-Driven Development) structure:

```typescript
test('AC#: should [expected behavior] @tags', async ({ testData, authenticatedAPI }) => {
  // Arrange - Set up test data
  const propertyData = testData.generateApartmentProperty();

  // Act - Perform the action
  const response = await propertiesPage.createProperty(propertyData);

  // Assert - Verify the outcome
  expect(response.status()).toBe(201);
});
```

#### Page Objects Used

- **PropertiesPage** (`page-objects/pages/PropertiesPage.ts`)
  - Handles all property-related page interactions
  - Provides methods for creating, viewing, and managing properties
  - Includes field-specific validation helpers

#### Test Data

Test data is generated using the test data factory:

```typescript
// Generate apartment property
const apartment = testData.generateApartmentProperty({
  bedrooms: 2,
  bathrooms: 1.5,
});

// Generate house property
const house = testData.generateHouseProperty({
  bedrooms: 4,
  bathrooms: 2.5,
});

// Generate parking space
const parking = testData.generateParkingSpaceProperty({
  parkingType: 'Underground',
  spaceNumber: 'B-42',
});
```

#### Cleanup Strategy

All tests use `afterEach` hooks to clean up created test data:

```typescript
test.afterEach(async ({ authenticatedAPI }) => {
  for (const propertyId of createdPropertyIds) {
    await authenticatedAPI.deleteProperty(propertyId);
  }
  createdPropertyIds = [];
});
```

This ensures:
- No test data pollution between test runs
- Database remains clean
- Tests can run in any order
- Tests can run in parallel

#### Test Data Isolation

Each test:
- Creates its own test data
- Cleans up after completion
- Does not depend on other tests
- Can run independently or in parallel

#### API Validation

Tests validate both UI behavior and API responses:

```typescript
// UI Action
const response = await propertiesPage.createProperty(propertyData);

// API Validation
const getResponse = await authenticatedAPI.getProperty(propertyId);
expect(getResponse.data.name).toBe(propertyData.name);
```

#### Assertions

Tests use comprehensive assertions:

- HTTP status codes (201 Created, 200 OK)
- Response body structure and values
- Database state via API
- UI feedback messages
- Form validation errors
- Timestamp accuracy

#### Best Practices Implemented

1. **Clear Test Names**: Each test name clearly describes what it tests
2. **BDD Structure**: Arrange-Act-Assert pattern throughout
3. **Explicit Cleanup**: All test data is explicitly cleaned up
4. **API Verification**: Critical assertions use API calls, not just UI
5. **Test Independence**: Each test can run standalone
6. **Realistic Data**: Faker.js generates realistic test data
7. **Proper Tagging**: Tests are tagged for easy filtering
8. **Comments**: Each test includes its acceptance criteria

#### Known Limitations

1. Tests assume the application is running on `http://localhost:3000`
2. Tests assume the API is running on `http://localhost:5000/api`
3. Tests require valid authentication (configured in `.env.test`)
4. Tests require a clean database state (handled by global setup)

#### Troubleshooting

**Authentication Issues**
- Verify `.env.test` has correct credentials
- Check `global-setup.ts` for authentication configuration
- Ensure Zitadel OIDC is properly configured

**Test Failures**
- Check if frontend and backend are running
- Verify database is accessible
- Check for existing test data that wasn't cleaned up
- Review test output for specific error messages

**Timeout Issues**
- Increase timeout in `playwright.config.ts`
- Check network connectivity
- Verify API response times

#### Future Enhancements

Potential additions to test coverage:

- [ ] Property image upload validation
- [ ] Bulk property import
- [ ] Property duplication detection
- [ ] Address validation/geocoding
- [ ] Property categorization/tagging
- [ ] Property search and filtering
- [ ] Co-ownership scenarios
- [ ] Property archival/soft delete
