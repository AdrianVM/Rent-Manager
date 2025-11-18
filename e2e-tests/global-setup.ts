import { chromium, FullConfig } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { authenticateUser } from './utils/auth-helper';
import { setupTestDatabase } from './utils/db-helper';

/**
 * Global Setup for E2E Tests
 *
 * This file runs once before all tests and performs:
 * 1. Database setup and seeding (if enabled)
 * 2. Authentication for all user roles (property owner, renter, admin)
 * 3. Storage state preparation for authenticated sessions
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for E2E tests...');

  const authDir = path.join(__dirname, 'test-results/.auth');

  // Ensure auth directory exists
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
    console.log(`✅ Created auth directory: ${authDir}`);
  }

  // Step 1: Setup test database if enabled
  if (process.env.ENABLE_DATABASE_SEEDING === 'true') {
    console.log('📊 Setting up test database...');
    try {
      await setupTestDatabase();
      console.log('✅ Test database setup complete');
    } catch (error) {
      console.error('❌ Failed to setup test database:', error);
      throw error;
    }
  }

  // Step 2: Authenticate users and save storage states
  const baseURL = process.env.BASE_URL || 'http://localhost:3000';
  const browser = await chromium.launch();

  try {
    // Authenticate Property Owner
    console.log('🔐 Authenticating Property Owner...');
    await authenticateAndSaveState(
      browser,
      baseURL,
      process.env.TEST_PROPERTY_OWNER_EMAIL!,
      process.env.TEST_PROPERTY_OWNER_PASSWORD!,
      path.join(authDir, 'property-owner.json')
    );
    console.log('✅ Property Owner authenticated');

    // Authenticate Renter
    console.log('🔐 Authenticating Renter...');
    await authenticateAndSaveState(
      browser,
      baseURL,
      process.env.TEST_RENTER_EMAIL!,
      process.env.TEST_RENTER_PASSWORD!,
      path.join(authDir, 'renter.json')
    );
    console.log('✅ Renter authenticated');

    // Authenticate Admin
    console.log('🔐 Authenticating Admin...');
    await authenticateAndSaveState(
      browser,
      baseURL,
      process.env.TEST_ADMIN_EMAIL!,
      process.env.TEST_ADMIN_PASSWORD!,
      path.join(authDir, 'admin.json')
    );
    console.log('✅ Admin authenticated');

  } catch (error) {
    console.error('❌ Authentication failed:', error);
    throw error;
  } finally {
    await browser.close();
  }

  console.log('✅ Global setup completed successfully!\n');
}

/**
 * Authenticate a user and save the storage state
 */
async function authenticateAndSaveState(
  browser: any,
  baseURL: string,
  email: string,
  password: string,
  storageStatePath: string
) {
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Use the auth helper to perform OIDC authentication
    await authenticateUser(page, email, password, baseURL);

    // Wait for authentication to complete and redirect back to app
    await page.waitForURL(`${baseURL}/**`, { timeout: 30000 });

    // Verify authentication was successful
    await page.waitForTimeout(2000); // Allow time for tokens to be stored

    // Save the storage state (cookies, localStorage, etc.)
    await context.storageState({ path: storageStatePath });

  } finally {
    await context.close();
  }
}

export default globalSetup;
