import { Page } from '@playwright/test';
import { BasePage } from '../base/BasePage';

/**
 * Properties Page Object
 *
 * Handles property management operations including:
 * - Navigating to properties page
 * - Creating new properties
 * - Viewing property list
 * - Filling property forms
 */
export class PropertiesPage extends BasePage {
  // Page URL
  private readonly propertiesPath = '/properties';
  private readonly createPropertyPath = '/properties/create';

  // Selectors
  private readonly selectors = {
    // Navigation
    createPropertyButton: '[data-testid="create-property-button"]',
    propertiesListContainer: '[data-testid="properties-list"]',

    // Property Form Fields
    propertyNameInput: '[data-testid="property-name-input"]',
    addressInput: '[data-testid="property-address-input"]',
    propertyTypeSelect: '[data-testid="property-type-select"]',
    rentAmountInput: '[data-testid="rent-amount-input"]',
    bedroomsInput: '[data-testid="bedrooms-input"]',
    bathroomsInput: '[data-testid="bathrooms-input"]',
    squareFootageInput: '[data-testid="square-footage-input"]',
    descriptionInput: '[data-testid="property-description-input"]',

    // Parking Space Specific Fields
    parkingTypeSelect: '[data-testid="parking-type-select"]',
    spaceNumberInput: '[data-testid="space-number-input"]',

    // Form Actions
    submitButton: '[data-testid="submit-property-button"]',
    cancelButton: '[data-testid="cancel-button"]',

    // Validation Messages
    validationError: '[data-testid="validation-error"]',
    errorMessage: '[data-testid="error-message"]',
    successMessage: '[data-testid="success-message"]',

    // Field-specific validation errors
    nameError: '[data-testid="property-name-error"]',
    addressError: '[data-testid="property-address-error"]',
    typeError: '[data-testid="property-type-error"]',
    rentError: '[data-testid="rent-amount-error"]',

    // Property List Items
    propertyCard: '[data-testid="property-card"]',
    propertyName: '[data-testid="property-name"]',
    propertyAddress: '[data-testid="property-address"]',
    propertyRent: '[data-testid="property-rent"]',
    propertyType: '[data-testid="property-type"]',
  };

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to properties list page
   */
  async navigateToProperties() {
    await this.goto(this.propertiesPath);
    await this.waitForPageLoad();
  }

  /**
   * Navigate to create property page
   */
  async navigateToCreateProperty() {
    await this.goto(this.createPropertyPath);
    await this.waitForPageLoad();
  }

  /**
   * Click the "Create Property" button from properties list
   */
  async clickCreateProperty() {
    await this.click(this.selectors.createPropertyButton);
    await this.waitForPageLoad();
  }

  /**
   * Fill basic property information
   */
  async fillBasicPropertyInfo(data: {
    name: string;
    address: string;
    type: string;
    rentAmount: number;
  }) {
    await this.fill(this.selectors.propertyNameInput, data.name);
    await this.fill(this.selectors.addressInput, data.address);
    await this.selectOption(this.selectors.propertyTypeSelect, data.type);
    await this.fill(this.selectors.rentAmountInput, data.rentAmount.toString());
  }

  /**
   * Fill apartment/house specific fields
   */
  async fillResidentialPropertyDetails(data: {
    bedrooms?: number;
    bathrooms?: number;
    squareFeet?: number;
    squareFootage?: number;
    description?: string;
  }) {
    if (data.bedrooms !== undefined) {
      await this.fill(this.selectors.bedroomsInput, data.bedrooms.toString());
    }
    if (data.bathrooms !== undefined) {
      await this.fill(this.selectors.bathroomsInput, data.bathrooms.toString());
    }
    const sqFt = data.squareFeet ?? data.squareFootage;
    if (sqFt !== undefined) {
      await this.fill(this.selectors.squareFootageInput, sqFt.toString());
    }
    if (data.description) {
      await this.fill(this.selectors.descriptionInput, data.description);
    }
  }

  /**
   * Fill parking space specific fields
   */
  async fillParkingSpaceDetails(data: {
    parkingType: string;
    spaceNumber: string;
  }) {
    await this.selectOption(this.selectors.parkingTypeSelect, data.parkingType);
    await this.fill(this.selectors.spaceNumberInput, data.spaceNumber);
  }

  /**
   * Submit property form
   */
  async submitPropertyForm() {
    await this.click(this.selectors.submitButton);
  }

  /**
   * Submit property form and wait for API response
   */
  async submitPropertyFormAndWaitForAPI() {
    const response = await this.waitForAPIResponse('/api/properties', async () => {
      await this.submitPropertyForm();
    });
    return response;
  }

  /**
   * Cancel property form
   */
  async cancelPropertyForm() {
    await this.click(this.selectors.cancelButton);
  }

  /**
   * Create a complete property (basic info + additional details)
   */
  async createProperty(propertyData: PropertyFormData) {
    // Fill basic information
    await this.fillBasicPropertyInfo({
      name: propertyData.name,
      address: propertyData.address,
      type: propertyData.type,
      rentAmount: propertyData.rentAmount,
    });

    // Fill type-specific fields
    if (propertyData.type === 'ParkingSpace' && propertyData.parkingType && propertyData.spaceNumber) {
      await this.fillParkingSpaceDetails({
        parkingType: propertyData.parkingType,
        spaceNumber: propertyData.spaceNumber,
      });
    } else {
      // Residential property (Apartment, House, Condo)
      await this.fillResidentialPropertyDetails({
        bedrooms: propertyData.bedrooms,
        bathrooms: propertyData.bathrooms,
        squareFeet: propertyData.squareFeet,
        squareFootage: propertyData.squareFootage,
        description: propertyData.description,
      });
    }

    // Submit form and wait for response
    return await this.submitPropertyFormAndWaitForAPI();
  }

  /**
   * Get validation error message
   */
  async getValidationError(): Promise<string> {
    return await this.getText(this.selectors.validationError);
  }

  /**
   * Get field-specific validation error
   */
  async getFieldError(field: 'name' | 'address' | 'type' | 'rent'): Promise<string> {
    const errorSelector = {
      name: this.selectors.nameError,
      address: this.selectors.addressError,
      type: this.selectors.typeError,
      rent: this.selectors.rentError,
    }[field];

    return await this.getText(errorSelector);
  }

  /**
   * Check if validation error is visible
   */
  async hasValidationError(): Promise<boolean> {
    return await this.isVisible(this.selectors.validationError);
  }

  /**
   * Get success message
   */
  async getSuccessMessage(): Promise<string> {
    return await this.getText(this.selectors.successMessage);
  }

  /**
   * Check if success message is visible
   */
  async hasSuccessMessage(): Promise<boolean> {
    return await this.isVisible(this.selectors.successMessage);
  }

  /**
   * Get error message
   */
  async getErrorMessage(): Promise<string> {
    return await this.getText(this.selectors.errorMessage);
  }

  /**
   * Wait for properties list to load
   */
  async waitForPropertiesList() {
    await this.waitForElement(this.selectors.propertiesListContainer);
  }

  /**
   * Get property cards count
   */
  async getPropertyCardsCount(): Promise<number> {
    return await this.getElementCount(this.selectors.propertyCard);
  }

  /**
   * Get property card by index
   */
  async getPropertyCardByIndex(index: number) {
    const cards = this.page.locator(this.selectors.propertyCard);
    return cards.nth(index);
  }

  /**
   * Find property card by name
   */
  async findPropertyByName(propertyName: string) {
    const cards = this.page.locator(this.selectors.propertyCard);
    const count = await cards.count();

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const name = await card.locator(this.selectors.propertyName).textContent();
      if (name?.includes(propertyName)) {
        return card;
      }
    }

    return null;
  }

  /**
   * Check if property exists in list
   */
  async propertyExistsInList(propertyName: string): Promise<boolean> {
    const property = await this.findPropertyByName(propertyName);
    return property !== null;
  }

  /**
   * Click on property card to view details
   */
  async clickPropertyCard(propertyName: string) {
    const property = await this.findPropertyByName(propertyName);
    if (property) {
      await property.click();
      await this.waitForPageLoad();
    } else {
      throw new Error(`Property "${propertyName}" not found in list`);
    }
  }

  /**
   * Wait for form to be ready
   */
  async waitForFormReady() {
    await this.waitForElement(this.selectors.propertyNameInput);
    await this.waitForElement(this.selectors.submitButton);
  }

  /**
   * Check if submit button is enabled
   */
  async isSubmitButtonEnabled(): Promise<boolean> {
    return await this.isEnabled(this.selectors.submitButton);
  }

  /**
   * Check if submit button is disabled
   */
  async isSubmitButtonDisabled(): Promise<boolean> {
    return await this.isDisabled(this.selectors.submitButton);
  }

  /**
   * Get property type options
   */
  async getPropertyTypeOptions(): Promise<string[]> {
    return await this.page.$$eval(
      `${this.selectors.propertyTypeSelect} option`,
      options => options.map(opt => opt.textContent || '')
    );
  }

  /**
   * Get parking type options
   */
  async getParkingTypeOptions(): Promise<string[]> {
    return await this.page.$$eval(
      `${this.selectors.parkingTypeSelect} option`,
      options => options.map(opt => opt.textContent || '')
    );
  }

  /**
   * Check if parking fields are visible
   */
  async areParkingFieldsVisible(): Promise<boolean> {
    return await this.isVisible(this.selectors.parkingTypeSelect);
  }

  /**
   * Check if residential fields are visible
   */
  async areResidentialFieldsVisible(): Promise<boolean> {
    return await this.isVisible(this.selectors.bedroomsInput);
  }

  /**
   * Get form field value
   */
  async getFieldValue(field: keyof typeof this.selectors): Promise<string> {
    const selector = this.selectors[field];
    return await this.getInputValue(selector);
  }

  /**
   * Clear all form fields
   */
  async clearAllFields() {
    await this.clear(this.selectors.propertyNameInput);
    await this.clear(this.selectors.addressInput);
    await this.clear(this.selectors.rentAmountInput);
  }
}

/**
 * Property form data interface
 */
export interface PropertyFormData {
  name: string;
  address: string;
  type: string;
  rentAmount: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  squareFootage?: number;
  description?: string;
  parkingType?: string;
  spaceNumber?: string;
}
