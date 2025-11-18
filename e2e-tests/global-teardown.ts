import { FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { cleanupTestDatabase } from './utils/db-helper';

/**
 * Global Teardown for E2E Tests
 *
 * This file runs once after all tests complete and performs:
 * 1. Database cleanup (if enabled)
 * 2. Removal of authentication state files
 * 3. Cleanup of temporary test artifacts
 */
async function globalTeardown(config: FullConfig) {
  console.log('\n🧹 Starting global teardown...');

  // Step 1: Cleanup test database if enabled
  if (process.env.ENABLE_TEST_DATA_CLEANUP === 'true') {
    console.log('🗑️  Cleaning up test database...');
    try {
      await cleanupTestDatabase();
      console.log('✅ Test database cleanup complete');
    } catch (error) {
      console.error('⚠️  Warning: Failed to cleanup test database:', error);
      // Don't throw - we want teardown to continue even if cleanup fails
    }
  }

  // Step 2: Remove authentication state files
  const authDir = path.join(__dirname, 'test-results/.auth');
  if (fs.existsSync(authDir)) {
    try {
      fs.rmSync(authDir, { recursive: true, force: true });
      console.log('✅ Removed authentication state files');
    } catch (error) {
      console.error('⚠️  Warning: Failed to remove auth files:', error);
    }
  }

  // Step 3: Cleanup temporary test artifacts (optional)
  // You can add additional cleanup logic here, such as:
  // - Removing uploaded test files
  // - Cleaning up test user data
  // - Resetting feature flags
  // - Clearing cache

  console.log('✅ Global teardown completed\n');
}

export default globalTeardown;
