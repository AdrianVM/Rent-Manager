/**
 * Utilities Index
 *
 * Central export point for all utility modules
 * Allows for easier imports in test files
 */

// Authentication utilities
export {
  authenticateUser,
  checkIfAuthenticated,
  logout,
  getAccessToken,
  getUserInfo,
  waitForAuthentication,
} from './auth-helper';

// Database utilities
export {
  getPool,
  closePool,
  executeQuery,
  setupTestDatabase,
  cleanupTestDatabase,
  getTestUser,
  createTestProperty,
  deleteTestProperty,
  createTestLease,
  deleteTestLease,
  getTestDataStats,
  resetDatabase,
} from './db-helper';

// API utilities
export {
  createAuthenticatedAPIContext,
  createAPIContext,
  APIResponse,
  get,
  post,
  put,
  patch,
  del,
  uploadFile,
  waitForOperation,
  batchRequests,
  retryRequest,
  RentManagerAPI,
} from './api-helper';

// Test data factory
export {
  generateProperty,
  generateTenant,
  generateLease,
  generatePayment,
  generateMaintenanceRequest,
  generateOwner,
  generateUserCredentials,
  generateProperties,
  generateTenants,
  generateLeases,
  generatePayments,
  generateMaintenanceRequests,
  generateTestScenario,
  seedFaker,
  resetFaker,
} from './test-data-factory';

// Type exports
export type {
  PropertyData,
  TenantData,
  LeaseData,
  PaymentData,
  MaintenanceRequestData,
  OwnerData,
  UserCredentials,
} from './test-data-factory';
