# Quick Start Guide - Create Property Tests

## Prerequisites

1. Ensure the application is running:
```bash
# Terminal 1 - Backend API
cd backend/RentManager.API
dotnet run

# Terminal 2 - Frontend
cd frontend
npm run dev
```

2. Verify test environment is configured:
```bash
cd e2e-tests
cat .env.test  # Check credentials are set
```

## Running the Tests

### Option 1: Run All Tests
```bash
cd e2e-tests
npx playwright test tests/property-owner/create-property.spec.ts
```

### Option 2: Run with UI Mode (Recommended for First Time)
```bash
cd e2e-tests
npx playwright test tests/property-owner/create-property.spec.ts --ui
```

This opens Playwright's UI where you can:
- See all 17 tests listed
- Run tests individually or all at once
- Watch tests execute in real-time
- Debug failing tests
- View screenshots and traces

### Option 3: Run Specific Tests

Run only smoke tests:
```bash
npx playwright test tests/property-owner/create-property.spec.ts --grep @smoke
```

Run only critical tests:
```bash
npx playwright test tests/property-owner/create-property.spec.ts --grep @critical
```

Run a specific test:
```bash
npx playwright test -g "AC1: should create a basic property"
```

### Option 4: Debug Mode
```bash
# Run with browser visible
npx playwright test tests/property-owner/create-property.spec.ts --headed

# Run with Playwright Inspector
npx playwright test tests/property-owner/create-property.spec.ts --debug
```

## Expected Test Output

When you run the tests, you should see output like this:

```
Running 17 tests using 1 worker

  ✓  [chromium] › create-property.spec.ts:34:3 › AC1: should create a basic property with required fields @smoke @critical (2.3s)
  ✓  [chromium] › create-property.spec.ts:73:3 › AC2: should create an Apartment with bedrooms and bathrooms @critical (1.9s)
  ✓  [chromium] › create-property.spec.ts:113:3 › AC2: should create a House with bedrooms and bathrooms @critical (2.1s)
  ✓  [chromium] › create-property.spec.ts:153:3 › AC3: should create a Parking Space with parking type and space number @critical (1.8s)
  ✓  [chromium] › create-property.spec.ts:191:3 › AC3: should create a Covered Parking Space @critical (1.7s)
  ✓  [chromium] › create-property.spec.ts:216:3 › AC3: should create an Outdoor Parking Space @critical (1.8s)
  ✓  [chromium] › create-property.spec.ts:241:3 › AC3: should create a Garage Parking Space @critical (1.7s)
  ✓  [chromium] › create-property.spec.ts:266:3 › AC4: should automatically set CreatedAt and UpdatedAt timestamps @critical (2.0s)
  ✓  [chromium] › create-property.spec.ts:316:3 › AC5: should show validation error when property name is missing (1.2s)
  ✓  [chromium] › create-property.spec.ts:337:3 › AC5: should show validation error when address is missing (1.1s)
  ✓  [chromium] › create-property.spec.ts:357:3 › AC5: should show validation error when rent amount is invalid (1.2s)
  ✓  [chromium] › create-property.spec.ts:377:3 › AC5: should show validation error when rent amount is zero (1.1s)
  ✓  [chromium] › create-property.spec.ts:397:3 › AC5: should show validation error when parking space missing space number (1.3s)
  ✓  [chromium] › create-property.spec.ts:421:3 › AC5: should not create property when validation fails (1.5s)
  ✓  [chromium] › create-property.spec.ts:453:3 › should create property via API directly @api (1.1s)
  ✓  [chromium] › create-property.spec.ts:490:3 › should show/hide appropriate fields based on property type (0.9s)
  ✓  [chromium] › create-property.spec.ts:520:3 › should create property with all optional fields populated (2.2s)

  17 passed (28.5s)
```

## Test Breakdown

### What Each Test Does

**AC1: Basic Property Creation**
- Creates an apartment with name, address, type, and rent
- Verifies property is created via API
- Validates all basic fields are saved correctly

**AC2: Residential Properties** (2 tests)
- Test 1: Creates apartment with 2 bedrooms, 1.5 bathrooms
- Test 2: Creates house with 4 bedrooms, 2.5 bathrooms
- Both verify bedrooms/bathrooms are saved

**AC3: Parking Spaces** (4 tests)
- Test 1: Underground parking with space number
- Test 2: Covered parking with space number
- Test 3: Outdoor parking with space number
- Test 4: Garage parking with space number
- All verify parking type and space number are saved

**AC4: Timestamps** (1 test)
- Creates property and captures timestamp
- Verifies CreatedAt is set automatically
- Verifies UpdatedAt is set automatically
- Confirms timestamps are within expected range

**AC5: Validation** (6 tests)
- Test 1: Empty property name shows error
- Test 2: Empty address shows error
- Test 3: Negative rent amount shows error
- Test 4: Zero rent amount shows error
- Test 5: Missing space number (parking) shows error
- Test 6: Failed validation prevents database creation

**Additional Tests** (4 tests)
- Test 1: Direct API property creation (no UI)
- Test 2: Form fields change based on property type
- Test 3: Create with all optional fields
- Test 4: Create multiple properties for same owner

## Troubleshooting

### Tests Fail with "Cannot connect to API"
**Solution:** Make sure backend is running on `http://localhost:5000`
```bash
cd backend/RentManager.API
dotnet run
```

### Tests Fail with "Navigation timeout"
**Solution:** Make sure frontend is running on `http://localhost:3000`
```bash
cd frontend
npm run dev
```

### Tests Fail with "Authentication error"
**Solution:** Check `.env.test` file has correct credentials
```bash
cd e2e-tests
cat .env.test
# Verify PROPERTY_OWNER_EMAIL and PROPERTY_OWNER_PASSWORD
```

### Tests Pass but Leave Test Data
**Solution:** This shouldn't happen - cleanup is automatic. If it does:
```bash
# Manually clean via API or database
# Check afterEach hooks are running
```

### Individual Test Fails
**Solution:** Run with trace to see what happened
```bash
npx playwright test tests/property-owner/create-property.spec.ts --trace on
```
Then view the trace:
```bash
npx playwright show-report
```

## Understanding Test Results

### Green Check (✓)
- Test passed successfully
- All assertions passed
- Cleanup completed

### Red X (✗)
- Test failed
- Check error message for details
- View trace or screenshot

### Yellow Warning (⚠)
- Test was skipped
- Usually due to .only or .skip

## Next Steps

After running these tests successfully:

1. Review the test code in `create-property.spec.ts`
2. Check the page object in `PropertiesPage.ts`
3. Run tests in UI mode to see step-by-step execution
4. Try modifying test data to see different scenarios
5. Use these tests as templates for other features

## Tips

1. Use `--headed` to see the browser during test execution
2. Use `--ui` mode for interactive debugging
3. Use `--grep` to run specific test subsets
4. Add `.only` to a test to run just that one
5. Use `--debug` to step through tests with debugger

Example with multiple options:
```bash
npx playwright test tests/property-owner/create-property.spec.ts --headed --grep @smoke
```

## Sample Test Run Commands

```bash
# Quick smoke test (fastest)
npx playwright test tests/property-owner/create-property.spec.ts --grep @smoke

# Full test suite
npx playwright test tests/property-owner/create-property.spec.ts

# Debug a failing test
npx playwright test tests/property-owner/create-property.spec.ts --grep "AC5" --debug

# Run with visual browser
npx playwright test tests/property-owner/create-property.spec.ts --headed --workers=1

# Generate report
npx playwright test tests/property-owner/create-property.spec.ts --reporter=html
npx playwright show-report
```

Happy Testing!
