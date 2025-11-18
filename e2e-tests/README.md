# Rent Manager E2E Tests

End-to-end testing infrastructure for the Rent Manager application using Playwright.

## Table of Contents

- [Overview](#overview)
- [Infrastructure](#infrastructure)
- [Setup](#setup)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Project Structure](#project-structure)
- [Best Practices](#best-practices)

## Overview

This test suite provides comprehensive end-to-end testing for the Rent Manager application, covering:

- **Multi-role authentication** (Property Owners, Renters, Admins)
- **Cross-browser testing** (Chromium, Firefox, WebKit)
- **Mobile testing** (Chrome Mobile, Safari Mobile)
- **API testing**
- **Database operations**
- **Test data generation**

## Infrastructure

The following infrastructure has been built to support robust E2E testing:

### Core Files

#### Global Setup & Teardown
- **global-setup.ts**: Authenticates all user roles and prepares test database
- **global-teardown.ts**: Cleans up test data and authentication states

#### Configuration
- **playwright.config.ts**: Main Playwright configuration
- **.env.test**: Environment variables for test execution
- **config/test-config.ts**: Centralized test constants and settings

### Utilities

#### Authentication (`utils/auth-helper.ts`)
- `authenticateUser()`: OIDC authentication via Zitadel
- `checkIfAuthenticated()`: Verify authentication status
- `getAccessToken()`: Retrieve JWT access token
- `logout()`: Logout current user
- `waitForAuthentication()`: Wait for auth to complete

#### Database Operations (`utils/db-helper.ts`)
- `setupTestDatabase()`: Initialize test database
- `cleanupTestDatabase()`: Remove test data
- `createTestProperty()`: Create test property
- `createTestLease()`: Create test lease agreement
- `executeQuery()`: Execute SQL queries
- `resetDatabase()`: Reset database to clean state (test environment only)

#### API Requests (`utils/api-helper.ts`)
- `createAuthenticatedAPIContext()`: Create authenticated API context
- `get()`, `post()`, `put()`, `patch()`, `del()`: HTTP request methods
- `waitForOperation()`: Poll endpoint until condition met
- `retryRequest()`: Retry with exponential backoff
- `RentManagerAPI`: Wrapper class for common API endpoints

#### Test Data Factory (`utils/test-data-factory.ts`)
- `generateProperty()`: Generate property data
- `generateTenant()`: Generate tenant data
- `generateLease()`: Generate lease data
- `generatePayment()`: Generate payment data
- `generateMaintenanceRequest()`: Generate maintenance request data
- `generateTestScenario()`: Generate complete test scenario

### Fixtures & Page Objects

#### Test Fixtures (`fixtures/test-fixtures.ts`)
Extended Playwright test with custom fixtures:
- `authenticatedAPI`: Authenticated API context
- `testData`: Test data factory functions
- `testActions`: Common test actions
- `screenshot`: Screenshot helpers

#### Base Page Object (`page-objects/base/BasePage.ts`)
Base class for all page objects with common methods:
- Navigation: `goto()`, `reload()`, `goBack()`
- Interactions: `click()`, `fill()`, `select()`, `check()`
- Waits: `waitForElement()`, `waitForLoading()`, `waitForAPIResponse()`
- Assertions: `isVisible()`, `isEnabled()`, `elementExists()`
- Storage: `getLocalStorageItem()`, `getCookies()`

## Setup

### 1. Install Dependencies

```bash
cd e2e-tests
npm install
```

### 2. Configure Environment

Copy `.env.test` and update with your test environment values:

```bash
# Update test user credentials
TEST_PROPERTY_OWNER_EMAIL=your.owner@test.com
TEST_PROPERTY_OWNER_PASSWORD=YourPassword123!

# Update database credentials
DB_PASSWORD=your_db_password

# Update Stripe test keys (if needed)
STRIPE_TEST_PUBLIC_KEY=pk_test_...
STRIPE_TEST_SECRET_KEY=sk_test_...
```

### 3. Install Playwright Browsers

```bash
npm run install:browsers
```

### 4. Verify Setup

```bash
# Run in headed mode to verify authentication works
npm run test:headed
```

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test Suites
```bash
npm run test:auth                 # Authentication tests
npm run test:property-owner       # Property owner tests
npm run test:renter              # Renter tests
npm run test:admin               # Admin tests
npm run test:api                 # API tests
```

### By Test Tags
```bash
npm run test:smoke               # Smoke tests
npm run test:critical            # Critical path tests
npm run test:regression          # Full regression suite
```

### Debug Mode
```bash
npm run test:debug               # Opens Playwright Inspector
npm run test:headed              # Run with visible browser
npm run test:ui                  # Open Playwright UI mode
```

### Parallel Execution
```bash
npm run test:parallel            # Run with 4 workers
```

### View Test Reports
```bash
npm run report
```

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '../fixtures/test-fixtures';

test.describe('Property Management', () => {
  test('should create a new property', async ({ page, testData, testActions }) => {
    // Generate test data
    const property = testData.generateProperty();

    // Navigate to properties page
    await testActions.navigateTo('/properties');

    // Perform actions
    await page.click('[data-testid="add-property-button"]');
    await page.fill('[name="name"]', property.name);
    await page.fill('[name="address"]', property.address);

    // Submit and verify
    const response = await testActions.waitForAPIResponse('/properties', async () => {
      await page.click('[data-testid="submit-button"]');
    });

    expect(response.status()).toBe(201);
  });
});
```

### Using Page Objects

```typescript
import { test, expect } from '../fixtures/test-fixtures';
import { PropertiesPage } from '../page-objects/pages/PropertiesPage';

test.describe('Property Management', () => {
  test('should create property using page object', async ({ page, testData }) => {
    const propertiesPage = new PropertiesPage(page);
    const property = testData.generateProperty();

    await propertiesPage.goto();
    await propertiesPage.createProperty(property);

    await expect(propertiesPage.successMessage).toBeVisible();
  });
});
```

### API Testing

```typescript
import { test, expect } from '../fixtures/test-fixtures';

test.describe('Properties API', () => {
  test('should get all properties', async ({ authenticatedAPI }) => {
    const response = await authenticatedAPI.getProperties();

    expect(response.isSuccess()).toBe(true);
    expect(Array.isArray(response.data)).toBe(true);
  });
});
```

### Database Setup/Teardown

```typescript
import { test, expect } from '../fixtures/test-fixtures';
import { createTestProperty, deleteTestProperty } from '../utils/db-helper';

test.describe('Property Tests', () => {
  let propertyId: string;

  test.beforeEach(async () => {
    // Create test property in database
    propertyId = await createTestProperty({
      name: 'Test Property',
      address: '123 Test St',
      ownerId: 'owner-id-123',
    });
  });

  test.afterEach(async () => {
    // Clean up test property
    await deleteTestProperty(propertyId);
  });

  test('should display property', async ({ page }) => {
    await page.goto(`/properties/${propertyId}`);
    await expect(page.locator('h1')).toContainText('Test Property');
  });
});
```

## Project Structure

```
e2e-tests/
├── config/
│   └── test-config.ts           # Test configuration and constants
├── fixtures/
│   └── test-fixtures.ts         # Playwright fixtures
├── page-objects/
│   ├── base/
│   │   └── BasePage.ts          # Base page object class
│   ├── components/              # Reusable component objects
│   └── pages/                   # Page-specific objects
├── tests/
│   ├── auth/                    # Authentication tests
│   ├── property-owner/          # Property owner tests
│   ├── renter/                  # Renter tests
│   ├── admin/                   # Admin tests
│   └── api/                     # API tests
├── utils/
│   ├── auth-helper.ts           # Authentication utilities
│   ├── db-helper.ts             # Database utilities
│   ├── api-helper.ts            # API request utilities
│   ├── test-data-factory.ts    # Test data generators
│   └── index.ts                 # Utility exports
├── global-setup.ts              # Global test setup
├── global-teardown.ts           # Global test teardown
├── playwright.config.ts         # Playwright configuration
├── .env.test                    # Environment variables
└── package.json                 # Dependencies and scripts
```

## Best Practices

### 1. Use Data Test IDs
Always use `data-testid` attributes for reliable selectors:
```html
<button data-testid="submit-button">Submit</button>
```

### 2. Use Fixtures
Leverage custom fixtures for common functionality:
```typescript
test('example', async ({ authenticatedAPI, testData, testActions }) => {
  // Use fixtures instead of importing utilities
});
```

### 3. Generate Test Data
Use the test data factory instead of hardcoding values:
```typescript
const property = testData.generateProperty({
  monthlyRent: 2000, // Override specific fields
});
```

### 4. Clean Up Test Data
Always clean up test data in `afterEach` or use database cleanup:
```typescript
test.afterEach(async () => {
  await deleteTestProperty(propertyId);
});
```

### 5. Use Page Objects
Encapsulate page logic in page objects:
```typescript
class PropertiesPage extends BasePage {
  async createProperty(data: PropertyData) {
    // Page-specific logic
  }
}
```

### 6. Tag Your Tests
Use tags for organizing test runs:
```typescript
test('critical user journey @smoke @critical', async ({ page }) => {
  // Test implementation
});
```

### 7. Wait for API Responses
Wait for API calls to complete before assertions:
```typescript
await testActions.waitForAPIResponse('/properties', async () => {
  await page.click('[data-testid="submit-button"]');
});
```

### 8. Use TypeScript
Leverage TypeScript for type safety and better IDE support:
```typescript
interface PropertyData {
  name: string;
  address: string;
  monthlyRent: number;
}
```

## Troubleshooting

### Authentication Fails
- Verify test user credentials in `.env.test`
- Check Zitadel configuration
- Run with `HEADLESS=false` to see authentication flow

### Tests Timeout
- Increase timeout in `test-config.ts`
- Check if application is running
- Verify network connectivity

### Database Connection Fails
- Verify database credentials in `.env.test`
- Ensure PostgreSQL is running
- Check database exists

### Flaky Tests
- Add proper waits for API responses
- Use `waitForLoading()` after actions
- Avoid hardcoded timeouts, use `waitFor` methods

## Next Steps

1. **Create test files** in the `tests/` directory
2. **Build page objects** for your application pages
3. **Add component objects** for reusable UI components
4. **Run tests in CI/CD** pipeline
5. **Monitor test results** and maintain test suite

---

For more information, see [Playwright Documentation](https://playwright.dev/)
