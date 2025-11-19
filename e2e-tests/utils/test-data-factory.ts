import { faker } from '@faker-js/faker';

/**
 * Test Data Factory
 *
 * Generates realistic test data for E2E tests using Faker.js
 */

/**
 * Generate test property data
 */
export function generateProperty(overrides?: Partial<PropertyData>): PropertyData {
  const bedrooms = faker.number.int({ min: 1, max: 5 });
  const bathrooms = faker.number.float({ min: 1, max: 3, fractionDigits: 1 });
  const squareFeet = faker.number.int({ min: 500, max: 3000 });

  return {
    name: `Test Property ${faker.location.streetAddress()}`,
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state({ abbreviated: true }),
    zipCode: faker.location.zipCode(),
    country: 'USA',
    bedrooms,
    bathrooms,
    squareFeet,
    propertyType: faker.helpers.arrayElement(['Apartment', 'House', 'Condo', 'Townhouse']),
    monthlyRent: faker.number.int({ min: 800, max: 3500 }),
    securityDeposit: faker.number.int({ min: 500, max: 2000 }),
    description: faker.lorem.paragraph(),
    amenities: faker.helpers.arrayElements(
      ['Parking', 'Laundry', 'Gym', 'Pool', 'Pet Friendly', 'Dishwasher', 'AC', 'Heating'],
      { min: 2, max: 5 }
    ),
    ...overrides,
  };
}

/**
 * Generate test parking space property data
 */
export function generateParkingSpaceProperty(overrides?: Partial<ParkingSpacePropertyData>): ParkingSpacePropertyData {
  const parkingTypes = ['Outdoor', 'Covered', 'Garage', 'Underground'];
  const spaceNumber = `${faker.helpers.arrayElement(['A', 'B', 'C', 'D'])}-${faker.number.int({ min: 1, max: 200 })}`;

  return {
    name: `Parking Space ${spaceNumber}`,
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state({ abbreviated: true }),
    zipCode: faker.location.zipCode(),
    country: 'USA',
    propertyType: 'ParkingSpace',
    parkingType: faker.helpers.arrayElement(parkingTypes),
    spaceNumber,
    monthlyRent: faker.number.int({ min: 50, max: 250 }),
    description: `${faker.helpers.arrayElement(parkingTypes)} parking space`,
    ...overrides,
  };
}

/**
 * Generate test apartment property data
 */
export function generateApartmentProperty(overrides?: Partial<PropertyData>): PropertyData {
  return generateProperty({
    propertyType: 'Apartment',
    bedrooms: faker.number.int({ min: 1, max: 3 }),
    bathrooms: faker.number.float({ min: 1, max: 2, fractionDigits: 1 }),
    squareFeet: faker.number.int({ min: 600, max: 1500 }),
    ...overrides,
  });
}

/**
 * Generate test house property data
 */
export function generateHouseProperty(overrides?: Partial<PropertyData>): PropertyData {
  return generateProperty({
    propertyType: 'House',
    bedrooms: faker.number.int({ min: 2, max: 5 }),
    bathrooms: faker.number.float({ min: 1.5, max: 3.5, fractionDigits: 1 }),
    squareFeet: faker.number.int({ min: 1200, max: 3500 }),
    ...overrides,
  });
}

export interface PropertyData {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  propertyType: string;
  monthlyRent: number;
  securityDeposit: number;
  description: string;
  amenities: string[];
}

export interface ParkingSpacePropertyData {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  propertyType: string;
  parkingType: string;
  spaceNumber: string;
  monthlyRent: number;
  description: string;
}

/**
 * Generate test tenant/renter data
 */
export function generateTenant(overrides?: Partial<TenantData>): TenantData {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return {
    firstName,
    lastName,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    phone: faker.phone.number(),
    dateOfBirth: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
    employmentStatus: faker.helpers.arrayElement(['Employed', 'Self-Employed', 'Student', 'Retired']),
    annualIncome: faker.number.int({ min: 30000, max: 120000 }),
    emergencyContactName: faker.person.fullName(),
    emergencyContactPhone: faker.phone.number(),
    pets: faker.datatype.boolean(),
    petDescription: faker.datatype.boolean() ? faker.lorem.sentence() : undefined,
    ...overrides,
  };
}

export interface TenantData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  employmentStatus: string;
  annualIncome: number;
  emergencyContactName: string;
  emergencyContactPhone: string;
  pets: boolean;
  petDescription?: string;
}

/**
 * Generate test lease agreement data
 */
export function generateLease(overrides?: Partial<LeaseData>): LeaseData {
  const startDate = faker.date.future({ years: 0.5 });
  const endDate = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + 1);

  return {
    startDate,
    endDate,
    monthlyRent: faker.number.int({ min: 800, max: 3500 }),
    securityDeposit: faker.number.int({ min: 500, max: 2000 }),
    paymentDueDay: faker.number.int({ min: 1, max: 28 }),
    latePaymentFee: faker.number.int({ min: 25, max: 100 }),
    terms: faker.lorem.paragraphs(3),
    status: 'Active',
    ...overrides,
  };
}

export interface LeaseData {
  startDate: Date;
  endDate: Date;
  monthlyRent: number;
  securityDeposit: number;
  paymentDueDay: number;
  latePaymentFee: number;
  terms: string;
  status: string;
}

/**
 * Generate test payment data
 */
export function generatePayment(overrides?: Partial<PaymentData>): PaymentData {
  return {
    amount: faker.number.int({ min: 500, max: 3000 }),
    paymentDate: faker.date.recent({ days: 30 }),
    paymentMethod: faker.helpers.arrayElement(['Credit Card', 'Bank Transfer', 'Check', 'Cash']),
    referenceNumber: faker.string.alphanumeric(10).toUpperCase(),
    notes: faker.lorem.sentence(),
    status: faker.helpers.arrayElement(['Pending', 'Completed', 'Failed']),
    ...overrides,
  };
}

export interface PaymentData {
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  referenceNumber: string;
  notes: string;
  status: string;
}

/**
 * Generate test maintenance request data
 */
export function generateMaintenanceRequest(overrides?: Partial<MaintenanceRequestData>): MaintenanceRequestData {
  const categories = ['Plumbing', 'Electrical', 'HVAC', 'Appliances', 'Structural', 'Pest Control', 'Other'];
  const priorities = ['Low', 'Medium', 'High', 'Urgent'];

  return {
    category: faker.helpers.arrayElement(categories),
    priority: faker.helpers.arrayElement(priorities),
    title: faker.helpers.arrayElement([
      'Leaking faucet in kitchen',
      'AC not working',
      'Broken dishwasher',
      'Water heater issue',
      'Electrical outlet not working',
      'Door lock needs repair',
      'Window won\'t close',
      'Garbage disposal broken',
    ]),
    description: faker.lorem.paragraph(),
    requestDate: faker.date.recent({ days: 7 }),
    status: faker.helpers.arrayElement(['Open', 'In Progress', 'Completed', 'Cancelled']),
    ...overrides,
  };
}

export interface MaintenanceRequestData {
  category: string;
  priority: string;
  title: string;
  description: string;
  requestDate: Date;
  status: string;
}

/**
 * Generate test owner/landlord data
 */
export function generateOwner(overrides?: Partial<OwnerData>): OwnerData {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const isCompany = faker.datatype.boolean();

  return {
    firstName: isCompany ? undefined : firstName,
    lastName: isCompany ? undefined : lastName,
    companyName: isCompany ? faker.company.name() : undefined,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    phone: faker.phone.number(),
    taxId: faker.string.numeric(9),
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state({ abbreviated: true }),
    zipCode: faker.location.zipCode(),
    bankAccountNumber: faker.finance.accountNumber(),
    bankRoutingNumber: faker.finance.routingNumber(),
    ...overrides,
  };
}

export interface OwnerData {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email: string;
  phone: string;
  taxId: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  bankAccountNumber: string;
  bankRoutingNumber: string;
}

/**
 * Generate test user credentials
 */
export function generateUserCredentials(overrides?: Partial<UserCredentials>): UserCredentials {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return {
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    password: 'Test123!@#',
    firstName,
    lastName,
    role: 'Renter',
    ...overrides,
  };
}

export interface UserCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
}

/**
 * Generate multiple properties
 */
export function generateProperties(count: number, overrides?: Partial<PropertyData>): PropertyData[] {
  return Array.from({ length: count }, () => generateProperty(overrides));
}

/**
 * Generate multiple tenants
 */
export function generateTenants(count: number, overrides?: Partial<TenantData>): TenantData[] {
  return Array.from({ length: count }, () => generateTenant(overrides));
}

/**
 * Generate multiple leases
 */
export function generateLeases(count: number, overrides?: Partial<LeaseData>): LeaseData[] {
  return Array.from({ length: count }, () => generateLease(overrides));
}

/**
 * Generate multiple payments
 */
export function generatePayments(count: number, overrides?: Partial<PaymentData>): PaymentData[] {
  return Array.from({ length: count }, () => generatePayment(overrides));
}

/**
 * Generate multiple maintenance requests
 */
export function generateMaintenanceRequests(
  count: number,
  overrides?: Partial<MaintenanceRequestData>
): MaintenanceRequestData[] {
  return Array.from({ length: count }, () => generateMaintenanceRequest(overrides));
}

/**
 * Generate complete test scenario data
 * Creates a full set of related data for comprehensive testing
 */
export function generateTestScenario() {
  const owner = generateOwner();
  const property = generateProperty();
  const tenant = generateTenant();
  const lease = generateLease();
  const payments = generatePayments(3, { status: 'Completed' });
  const maintenanceRequests = generateMaintenanceRequests(2);

  return {
    owner,
    property,
    tenant,
    lease,
    payments,
    maintenanceRequests,
  };
}

/**
 * Seed faker for deterministic test data (useful for debugging)
 */
export function seedFaker(seed: number = 12345) {
  faker.seed(seed);
}

/**
 * Reset faker seed to random (default behavior)
 */
export function resetFaker() {
  faker.seed();
}
