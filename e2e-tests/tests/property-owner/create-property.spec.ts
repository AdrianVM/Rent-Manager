import { test, expect } from '../../fixtures/test-fixtures';
import { PropertiesPage } from '../../page-objects/pages/PropertiesPage';

/**
 * E2E Tests for User Story 2.1.1: Create Property
 *
 * Tests cover all acceptance criteria:
 * - AC1: Basic property creation with name, address, type, rent
 * - AC2: Residential properties with bedrooms/bathrooms
 * - AC3: Parking space properties with parking type and space number
 * - AC4: Timestamp validation (CreatedAt, UpdatedAt)
 * - AC5: Validation errors for invalid data
 *
 * @tags @property-owner @property-creation @smoke @critical
 */

test.describe('User Story 2.1.1: Create Property', () => {
  let propertiesPage: PropertiesPage;
  let createdPropertyIds: string[] = [];

  test.beforeEach(async ({ page }) => {
    propertiesPage = new PropertiesPage(page);
    await propertiesPage.navigateToCreateProperty();
    await propertiesPage.waitForFormReady();
  });

  test.afterEach(async ({ authenticatedAPI }) => {
    // Cleanup: Delete all created properties
    for (const propertyId of createdPropertyIds) {
      try {
        await authenticatedAPI.deleteProperty(propertyId);
      } catch (error) {
        console.warn(`Failed to delete property ${propertyId}:`, error);
      }
    }
    createdPropertyIds = [];
  });

  /**
   * AC1: Basic Property Creation
   * Given I am a property owner
   * When I provide property name, address, type, and rent amount
   * Then a new property is created and linked to my account
   */
  test('AC1: should create a basic property with required fields @smoke @critical', async ({
    testData,
    authenticatedAPI,
  }) => {
    // Arrange
    const propertyData = testData.generateApartmentProperty({
      name: 'Test Apartment Downtown',
      address: '123 Main Street',
      propertyType: 'Apartment',
      monthlyRent: 1500,
    });

    // Act
    const response = await propertiesPage.createProperty({
      name: propertyData.name,
      address: propertyData.address,
      type: propertyData.propertyType,
      rentAmount: propertyData.monthlyRent,
      bedrooms: propertyData.bedrooms,
      bathrooms: propertyData.bathrooms,
      squareFeet: propertyData.squareFeet,
      description: propertyData.description,
    });

    // Assert - UI feedback
    expect(response.status()).toBe(201);
    const responseBody = await response.json();
    const propertyId = responseBody.id;
    createdPropertyIds.push(propertyId);

    // Verify property was created via API
    const getPropertyResponse = await authenticatedAPI.getProperty(propertyId);
    expect(getPropertyResponse.status).toBe(200);
    expect(getPropertyResponse.data.name).toBe(propertyData.name);
    expect(getPropertyResponse.data.address).toBe(propertyData.address);
    expect(getPropertyResponse.data.type).toBe(propertyData.propertyType);
    expect(getPropertyResponse.data.rentAmount).toBe(propertyData.monthlyRent);
  });

  /**
   * AC2: Residential Property with Bedrooms/Bathrooms
   * Given I am creating a property
   * When I specify property type as Apartment or House
   * Then I can provide bedrooms and bathrooms information
   */
  test('AC2: should create an Apartment with bedrooms and bathrooms @critical', async ({
    testData,
    authenticatedAPI,
  }) => {
    // Arrange
    const apartmentData = testData.generateApartmentProperty({
      bedrooms: 2,
      bathrooms: 1.5,
      squareFeet: 950,
    });

    // Act
    const response = await propertiesPage.createProperty({
      name: apartmentData.name,
      address: apartmentData.address,
      type: 'Apartment',
      rentAmount: apartmentData.monthlyRent,
      bedrooms: 2,
      bathrooms: 1.5,
      squareFeet: 950,
      description: apartmentData.description,
    });

    // Assert
    expect(response.status()).toBe(201);
    const responseBody = await response.json();
    const propertyId = responseBody.id;
    createdPropertyIds.push(propertyId);

    // Verify bedrooms and bathrooms via API
    const getPropertyResponse = await authenticatedAPI.getProperty(propertyId);
    expect(getPropertyResponse.status).toBe(200);
    expect(getPropertyResponse.data.bedrooms).toBe(2);
    expect(getPropertyResponse.data.bathrooms).toBe(1.5);
    expect(getPropertyResponse.data.squareFootage).toBe(950);
  });

  test('AC2: should create a House with bedrooms and bathrooms @critical', async ({
    testData,
    authenticatedAPI,
  }) => {
    // Arrange
    const houseData = testData.generateHouseProperty({
      bedrooms: 4,
      bathrooms: 2.5,
      squareFeet: 2200,
    });

    // Act
    const response = await propertiesPage.createProperty({
      name: houseData.name,
      address: houseData.address,
      type: 'House',
      rentAmount: houseData.monthlyRent,
      bedrooms: 4,
      bathrooms: 2.5,
      squareFeet: 2200,
      description: houseData.description,
    });

    // Assert
    expect(response.status()).toBe(201);
    const responseBody = await response.json();
    const propertyId = responseBody.id;
    createdPropertyIds.push(propertyId);

    // Verify via API
    const getPropertyResponse = await authenticatedAPI.getProperty(propertyId);
    expect(getPropertyResponse.status).toBe(200);
    expect(getPropertyResponse.data.type).toBe('House');
    expect(getPropertyResponse.data.bedrooms).toBe(4);
    expect(getPropertyResponse.data.bathrooms).toBe(2.5);
    expect(getPropertyResponse.data.squareFootage).toBe(2200);
  });

  /**
   * AC3: Parking Space Property
   * Given I am creating a parking space property
   * When I select ParkingSpace type
   * Then I can specify parking type (Outdoor, Covered, Garage, Underground) and space number
   */
  test('AC3: should create a Parking Space with parking type and space number @critical', async ({
    testData,
    authenticatedAPI,
  }) => {
    // Arrange
    const parkingData = testData.generateParkingSpaceProperty({
      parkingType: 'Underground',
      spaceNumber: 'B-42',
      monthlyRent: 150,
    });

    // Act
    const response = await propertiesPage.createProperty({
      name: parkingData.name,
      address: parkingData.address,
      type: 'ParkingSpace',
      rentAmount: parkingData.monthlyRent,
      parkingType: 'Underground',
      spaceNumber: 'B-42',
    });

    // Assert
    expect(response.status()).toBe(201);
    const responseBody = await response.json();
    const propertyId = responseBody.id;
    createdPropertyIds.push(propertyId);

    // Verify parking details via API
    const getPropertyResponse = await authenticatedAPI.getProperty(propertyId);
    expect(getPropertyResponse.status).toBe(200);
    expect(getPropertyResponse.data.type).toBe('ParkingSpace');
    expect(getPropertyResponse.data.parkingType).toBe('Underground');
    expect(getPropertyResponse.data.spaceNumber).toBe('B-42');
  });

  test('AC3: should create a Covered Parking Space @critical', async ({
    testData,
    authenticatedAPI,
  }) => {
    // Arrange
    const parkingData = testData.generateParkingSpaceProperty({
      parkingType: 'Covered',
      spaceNumber: 'A-15',
    });

    // Act
    const response = await propertiesPage.createProperty({
      name: parkingData.name,
      address: parkingData.address,
      type: 'ParkingSpace',
      rentAmount: parkingData.monthlyRent,
      parkingType: 'Covered',
      spaceNumber: 'A-15',
    });

    // Assert
    expect(response.status()).toBe(201);
    const responseBody = await response.json();
    createdPropertyIds.push(responseBody.id);

    const getPropertyResponse = await authenticatedAPI.getProperty(responseBody.id);
    expect(getPropertyResponse.data.parkingType).toBe('Covered');
  });

  test('AC3: should create an Outdoor Parking Space @critical', async ({
    testData,
    authenticatedAPI,
  }) => {
    // Arrange
    const parkingData = testData.generateParkingSpaceProperty({
      parkingType: 'Outdoor',
      spaceNumber: 'C-99',
    });

    // Act
    const response = await propertiesPage.createProperty({
      name: parkingData.name,
      address: parkingData.address,
      type: 'ParkingSpace',
      rentAmount: parkingData.monthlyRent,
      parkingType: 'Outdoor',
      spaceNumber: 'C-99',
    });

    // Assert
    expect(response.status()).toBe(201);
    const responseBody = await response.json();
    createdPropertyIds.push(responseBody.id);

    const getPropertyResponse = await authenticatedAPI.getProperty(responseBody.id);
    expect(getPropertyResponse.data.parkingType).toBe('Outdoor');
  });

  test('AC3: should create a Garage Parking Space @critical', async ({
    testData,
    authenticatedAPI,
  }) => {
    // Arrange
    const parkingData = testData.generateParkingSpaceProperty({
      parkingType: 'Garage',
      spaceNumber: 'D-7',
    });

    // Act
    const response = await propertiesPage.createProperty({
      name: parkingData.name,
      address: parkingData.address,
      type: 'ParkingSpace',
      rentAmount: parkingData.monthlyRent,
      parkingType: 'Garage',
      spaceNumber: 'D-7',
    });

    // Assert
    expect(response.status()).toBe(201);
    const responseBody = await response.json();
    createdPropertyIds.push(responseBody.id);

    const getPropertyResponse = await authenticatedAPI.getProperty(responseBody.id);
    expect(getPropertyResponse.data.parkingType).toBe('Garage');
  });

  /**
   * AC4: Timestamp Validation
   * Given I create a property
   * When the property is saved
   * Then CreatedAt and UpdatedAt timestamps are automatically set
   */
  test('AC4: should automatically set CreatedAt and UpdatedAt timestamps @critical', async ({
    testData,
    authenticatedAPI,
  }) => {
    // Arrange
    const propertyData = testData.generateApartmentProperty();
    const beforeCreation = new Date();

    // Act
    const response = await propertiesPage.createProperty({
      name: propertyData.name,
      address: propertyData.address,
      type: propertyData.propertyType,
      rentAmount: propertyData.monthlyRent,
      bedrooms: propertyData.bedrooms,
      bathrooms: propertyData.bathrooms,
    });

    const afterCreation = new Date();

    // Assert
    expect(response.status()).toBe(201);
    const responseBody = await response.json();
    const propertyId = responseBody.id;
    createdPropertyIds.push(propertyId);

    // Verify timestamps via API
    const getPropertyResponse = await authenticatedAPI.getProperty(propertyId);
    expect(getPropertyResponse.status).toBe(200);

    const createdAt = new Date(getPropertyResponse.data.createdAt);
    const updatedAt = new Date(getPropertyResponse.data.updatedAt);

    // Timestamps should be set
    expect(getPropertyResponse.data.createdAt).toBeDefined();
    expect(getPropertyResponse.data.updatedAt).toBeDefined();

    // Timestamps should be within reasonable range (within test execution time)
    expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime() - 5000);
    expect(createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime() + 5000);

    // UpdatedAt should equal CreatedAt for new properties
    expect(updatedAt.getTime()).toBe(createdAt.getTime());
  });

  /**
   * AC5: Validation Errors
   * Given I provide invalid data
   * When I attempt to create a property
   * Then I receive validation errors and the property is not created
   */
  test('AC5: should show validation error when property name is missing', async ({
    testData,
  }) => {
    // Arrange
    const propertyData = testData.generateApartmentProperty();

    // Act - Fill form without name
    await propertiesPage.fillBasicPropertyInfo({
      name: '', // Empty name
      address: propertyData.address,
      type: 'Apartment',
      rentAmount: propertyData.monthlyRent,
    });

    // Try to submit
    await propertiesPage.submitPropertyForm();

    // Assert - Should show validation error
    const hasError = await propertiesPage.hasValidationError();
    expect(hasError).toBe(true);
  });

  test('AC5: should show validation error when address is missing', async ({
    testData,
  }) => {
    // Arrange
    const propertyData = testData.generateApartmentProperty();

    // Act - Fill form without address
    await propertiesPage.fillBasicPropertyInfo({
      name: propertyData.name,
      address: '', // Empty address
      type: 'Apartment',
      rentAmount: propertyData.monthlyRent,
    });

    await propertiesPage.submitPropertyForm();

    // Assert
    const hasError = await propertiesPage.hasValidationError();
    expect(hasError).toBe(true);
  });

  test('AC5: should show validation error when rent amount is invalid', async ({
    testData,
  }) => {
    // Arrange
    const propertyData = testData.generateApartmentProperty();

    // Act - Fill form with negative rent
    await propertiesPage.fillBasicPropertyInfo({
      name: propertyData.name,
      address: propertyData.address,
      type: 'Apartment',
      rentAmount: -100, // Invalid negative rent
    });

    await propertiesPage.submitPropertyForm();

    // Assert
    const hasError = await propertiesPage.hasValidationError();
    expect(hasError).toBe(true);
  });

  test('AC5: should show validation error when rent amount is zero', async ({
    testData,
  }) => {
    // Arrange
    const propertyData = testData.generateApartmentProperty();

    // Act
    await propertiesPage.fillBasicPropertyInfo({
      name: propertyData.name,
      address: propertyData.address,
      type: 'Apartment',
      rentAmount: 0, // Zero rent
    });

    await propertiesPage.submitPropertyForm();

    // Assert
    const hasError = await propertiesPage.hasValidationError();
    expect(hasError).toBe(true);
  });

  test('AC5: should show validation error when parking space missing space number', async ({
    testData,
  }) => {
    // Arrange
    const parkingData = testData.generateParkingSpaceProperty();

    // Act - Create parking space without space number
    await propertiesPage.fillBasicPropertyInfo({
      name: parkingData.name,
      address: parkingData.address,
      type: 'ParkingSpace',
      rentAmount: parkingData.monthlyRent,
    });

    // Fill parking type but not space number
    await propertiesPage.fillParkingSpaceDetails({
      parkingType: 'Garage',
      spaceNumber: '', // Empty space number
    });

    await propertiesPage.submitPropertyForm();

    // Assert
    const hasError = await propertiesPage.hasValidationError();
    expect(hasError).toBe(true);
  });

  test('AC5: should not create property when validation fails', async ({
    testData,
    authenticatedAPI,
  }) => {
    // Arrange
    const initialPropertiesResponse = await authenticatedAPI.getProperties();
    const initialCount = initialPropertiesResponse.data?.length || 0;

    // Act - Try to create property with invalid data
    await propertiesPage.fillBasicPropertyInfo({
      name: '', // Invalid: empty name
      address: 'Test Address',
      type: 'Apartment',
      rentAmount: 1000,
    });

    await propertiesPage.submitPropertyForm();

    // Wait a bit to ensure any backend call would have completed
    await propertiesPage.wait(1000);

    // Assert - Property count should not increase
    const afterPropertiesResponse = await authenticatedAPI.getProperties();
    const afterCount = afterPropertiesResponse.data?.length || 0;
    expect(afterCount).toBe(initialCount);
  });

  /**
   * Additional Test: API-only property creation
   * Verifies the API endpoint works correctly without UI
   */
  test('should create property via API directly @api', async ({
    testData,
    authenticatedAPI,
  }) => {
    // Arrange
    const propertyData = testData.generateApartmentProperty({
      name: 'API Test Property',
      propertyType: 'Apartment',
      bedrooms: 3,
      bathrooms: 2,
    });

    // Act
    const createResponse = await authenticatedAPI.createProperty({
      name: propertyData.name,
      address: propertyData.address,
      type: propertyData.propertyType,
      rentAmount: propertyData.monthlyRent,
      bedrooms: propertyData.bedrooms,
      bathrooms: propertyData.bathrooms,
      squareFootage: propertyData.squareFeet,
      description: propertyData.description,
    });

    // Assert
    expect(createResponse.status).toBe(201);
    expect(createResponse.data.name).toBe(propertyData.name);
    expect(createResponse.data.type).toBe(propertyData.propertyType);

    const propertyId = createResponse.data.id;
    createdPropertyIds.push(propertyId);

    // Verify property can be retrieved
    const getResponse = await authenticatedAPI.getProperty(propertyId);
    expect(getResponse.status).toBe(200);
    expect(getResponse.data.id).toBe(propertyId);
  });

  /**
   * Additional Test: Form field validation on type change
   * When property type changes, appropriate fields should be shown/hidden
   */
  test('should show/hide appropriate fields based on property type', async ({ page }) => {
    // Start with Apartment
    await propertiesPage.fillBasicPropertyInfo({
      name: 'Test Property',
      address: '123 Test St',
      type: 'Apartment',
      rentAmount: 1000,
    });

    // Residential fields should be visible
    let residentialVisible = await propertiesPage.areResidentialFieldsVisible();
    expect(residentialVisible).toBe(true);

    // Change to ParkingSpace
    await propertiesPage.fillBasicPropertyInfo({
      name: 'Test Property',
      address: '123 Test St',
      type: 'ParkingSpace',
      rentAmount: 100,
    });

    // Parking fields should be visible
    const parkingVisible = await propertiesPage.areParkingFieldsVisible();
    expect(parkingVisible).toBe(true);
  });

  /**
   * Additional Test: Create property with all optional fields
   */
  test('should create property with all optional fields populated', async ({
    testData,
    authenticatedAPI,
  }) => {
    // Arrange
    const propertyData = testData.generateHouseProperty({
      bedrooms: 5,
      bathrooms: 3.5,
      squareFeet: 3200,
      description: 'Beautiful house with modern amenities and spacious backyard',
    });

    // Act
    const response = await propertiesPage.createProperty({
      name: propertyData.name,
      address: propertyData.address,
      type: 'House',
      rentAmount: propertyData.monthlyRent,
      bedrooms: 5,
      bathrooms: 3.5,
      squareFeet: 3200,
      description: propertyData.description,
    });

    // Assert
    expect(response.status()).toBe(201);
    const responseBody = await response.json();
    createdPropertyIds.push(responseBody.id);

    const getPropertyResponse = await authenticatedAPI.getProperty(responseBody.id);
    expect(getPropertyResponse.data.description).toBe(propertyData.description);
    expect(getPropertyResponse.data.squareFootage).toBe(3200);
  });

  /**
   * Additional Test: Create multiple properties
   * Verify multiple properties can be created and are linked to the owner
   */
  test('should create multiple properties for the same owner', async ({
    testData,
    authenticatedAPI,
  }) => {
    // Get initial property count
    const initialResponse = await authenticatedAPI.getProperties();
    const initialCount = initialResponse.data?.length || 0;

    // Create first property
    const property1 = testData.generateApartmentProperty({ name: 'Property 1' });
    const response1 = await authenticatedAPI.createProperty({
      name: property1.name,
      address: property1.address,
      type: property1.propertyType,
      rentAmount: property1.monthlyRent,
      bedrooms: property1.bedrooms,
      bathrooms: property1.bathrooms,
    });
    expect(response1.status).toBe(201);
    createdPropertyIds.push(response1.data.id);

    // Create second property
    const property2 = testData.generateHouseProperty({ name: 'Property 2' });
    const response2 = await authenticatedAPI.createProperty({
      name: property2.name,
      address: property2.address,
      type: property2.propertyType,
      rentAmount: property2.monthlyRent,
      bedrooms: property2.bedrooms,
      bathrooms: property2.bathrooms,
    });
    expect(response2.status).toBe(201);
    createdPropertyIds.push(response2.data.id);

    // Create third property
    const property3 = testData.generateParkingSpaceProperty({ name: 'Property 3' });
    const response3 = await authenticatedAPI.createProperty({
      name: property3.name,
      address: property3.address,
      type: 'ParkingSpace',
      rentAmount: property3.monthlyRent,
      parkingType: property3.parkingType,
      spaceNumber: property3.spaceNumber,
    });
    expect(response3.status).toBe(201);
    createdPropertyIds.push(response3.data.id);

    // Verify all properties are returned for the owner
    const finalResponse = await authenticatedAPI.getProperties();
    const finalCount = finalResponse.data?.length || 0;
    expect(finalCount).toBe(initialCount + 3);
  });
});
