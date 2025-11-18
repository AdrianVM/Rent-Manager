/**
 * Test Configuration
 *
 * Central configuration for E2E tests
 * Contains constants, timeouts, and environment-specific settings
 */

export const TestConfig = {
  // Base URLs
  baseURL: process.env.BASE_URL || 'http://localhost:3000',
  apiBaseURL: process.env.API_BASE_URL || 'http://localhost:5000/api',

  // Zitadel OAuth Configuration
  auth: {
    authority: process.env.ZITADEL_AUTHORITY || 'https://rent-manager-txkjry.us1.zitadel.cloud',
    clientId: process.env.ZITADEL_CLIENT_ID || '343292464775381118',
    redirectUri: process.env.ZITADEL_REDIRECT_URI || 'http://localhost:3000/auth/callback',
  },

  // Test User Credentials
  users: {
    propertyOwner: {
      email: process.env.TEST_PROPERTY_OWNER_EMAIL || 'owner.test@rentmanager.com',
      password: process.env.TEST_PROPERTY_OWNER_PASSWORD || 'TestPassword123!',
      role: 'PropertyOwner',
    },
    renter: {
      email: process.env.TEST_RENTER_EMAIL || 'renter.test@rentmanager.com',
      password: process.env.TEST_RENTER_PASSWORD || 'TestPassword123!',
      role: 'Renter',
    },
    admin: {
      email: process.env.TEST_ADMIN_EMAIL || 'admin.test@rentmanager.com',
      password: process.env.TEST_ADMIN_PASSWORD || 'TestPassword123!',
      role: 'Admin',
    },
  },

  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'rentmanager_test',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  },

  // Stripe Test Configuration
  stripe: {
    publicKey: process.env.STRIPE_TEST_PUBLIC_KEY || '',
    secretKey: process.env.STRIPE_TEST_SECRET_KEY || '',
  },

  // Test Data Configuration
  testData: {
    enableCleanup: process.env.ENABLE_TEST_DATA_CLEANUP === 'true',
    enableSeeding: process.env.ENABLE_DATABASE_SEEDING === 'true',
  },

  // Timeout Configuration (milliseconds)
  timeouts: {
    short: parseInt(process.env.SHORT_TIMEOUT || '10000'),
    default: parseInt(process.env.DEFAULT_TIMEOUT || '30000'),
    long: parseInt(process.env.LONG_TIMEOUT || '60000'),
    navigation: 30000,
    apiRequest: 15000,
    pageLoad: 30000,
    elementVisible: 10000,
  },

  // Retry Configuration
  retries: {
    maxRetries: parseInt(process.env.RETRY_COUNT || '2'),
    retryDelay: 1000,
  },

  // Parallel Execution
  parallel: {
    maxWorkers: parseInt(process.env.MAX_WORKERS || '4'),
  },

  // Screenshot and Video Configuration
  capture: {
    screenshot: process.env.CAPTURE_SCREENSHOT || 'only-on-failure',
    video: process.env.CAPTURE_VIDEO || 'retain-on-failure',
  },

  // CI/CD Configuration
  ci: {
    isCI: process.env.CI === 'true',
  },

  // Browser Configuration
  browser: {
    headless: process.env.HEADLESS !== 'false',
    viewport: {
      width: 1920,
      height: 1080,
    },
  },

  // Test Selectors (Data Test IDs)
  selectors: {
    // Navigation
    loginButton: '[data-testid="login-button"]',
    logoutButton: '[data-testid="logout-button"]',
    userMenu: '[data-testid="user-menu"]',

    // Forms
    submitButton: '[data-testid="submit-button"]',
    cancelButton: '[data-testid="cancel-button"]',
    saveButton: '[data-testid="save-button"]',
    deleteButton: '[data-testid="delete-button"]',

    // Loading states
    loading: '[data-testid="loading"]',
    spinner: '.spinner, .loading, [aria-busy="true"]',

    // Notifications
    successNotification: '[data-testid="success-notification"]',
    errorNotification: '[data-testid="error-notification"]',
    warningNotification: '[data-testid="warning-notification"]',

    // Dialogs
    confirmDialog: '[data-testid="confirm-dialog"]',
    alertDialog: '[data-testid="alert-dialog"]',
  },

  // API Endpoints
  endpoints: {
    properties: '/properties',
    leases: '/leases',
    payments: '/payments',
    maintenanceRequests: '/maintenance-requests',
    tenants: '/tenants',
    owners: '/owners',
    users: '/users',
  },

  // Test Tags
  tags: {
    smoke: '@smoke',
    critical: '@critical',
    regression: '@regression',
    auth: '@auth',
    propertyOwner: '@property-owner',
    renter: '@renter',
    admin: '@admin',
    api: '@api',
  },
};

/**
 * Get timeout value by name
 */
export function getTimeout(name: keyof typeof TestConfig.timeouts): number {
  return TestConfig.timeouts[name];
}

/**
 * Get test user by role
 */
export function getTestUser(role: 'propertyOwner' | 'renter' | 'admin') {
  return TestConfig.users[role];
}

/**
 * Check if running in CI environment
 */
export function isCI(): boolean {
  return TestConfig.ci.isCI;
}

/**
 * Get API endpoint URL
 */
export function getEndpoint(endpoint: keyof typeof TestConfig.endpoints): string {
  return `${TestConfig.apiBaseURL}${TestConfig.endpoints[endpoint]}`;
}

/**
 * Get full URL for a path
 */
export function getURL(path: string): string {
  return `${TestConfig.baseURL}${path}`;
}

export default TestConfig;
