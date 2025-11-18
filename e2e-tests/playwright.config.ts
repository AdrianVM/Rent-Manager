import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

// Load environment variables from .env.test
dotenv.config({ path: '.env.test' });

/**
 * Playwright Configuration for Rent Manager E2E Tests
 *
 * This configuration provides:
 * - Multi-browser testing (Chromium, Firefox, WebKit)
 * - Parallel execution for faster test runs
 * - Automatic retries for flaky tests
 * - Screenshot and video capture on failure
 * - API testing capabilities
 * - Multiple environments (local, staging, production)
 */
export default defineConfig({
  // Test directory
  testDir: './tests',

  // Maximum time one test can run for
  timeout: 60 * 1000, // 60 seconds

  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI, // Fail if test.only is left in CI
  retries: process.env.CI ? 2 : 0, // Retry failed tests in CI
  workers: process.env.CI ? 2 : 4, // Number of parallel workers

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'] // Console output
  ],

  // Shared settings for all tests
  use: {
    // Base URL for all tests
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // API base URL
    extraHTTPHeaders: {
      'Accept': 'application/json',
    },

    // Browser options
    headless: process.env.HEADLESS !== 'false',
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true, // For local dev with self-signed certs

    // Capture screenshot on failure
    screenshot: 'only-on-failure',

    // Capture video on first retry
    video: 'retain-on-failure',

    // Capture traces on first retry
    trace: 'on-first-retry',

    // Action timeout
    actionTimeout: 15 * 1000, // 15 seconds

    // Navigation timeout
    navigationTimeout: 30 * 1000, // 30 seconds
  },

  // Projects for different browsers and scenarios
  projects: [
    // Setup project - runs once before all tests
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
    },

    // Desktop browsers
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use authenticated state from setup
        storageState: 'test-results/.auth/property-owner.json',
      },
      dependencies: ['setup'],
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'test-results/.auth/property-owner.json',
      },
      dependencies: ['setup'],
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: 'test-results/.auth/property-owner.json',
      },
      dependencies: ['setup'],
    },

    // Mobile browsers (important for PWA testing)
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        storageState: 'test-results/.auth/property-owner.json',
      },
      dependencies: ['setup'],
    },

    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 13'],
        storageState: 'test-results/.auth/property-owner.json',
      },
      dependencies: ['setup'],
    },

    // API testing (no browser needed)
    {
      name: 'api',
      testMatch: /.*\.api\.spec\.ts/,
      use: {
        baseURL: process.env.API_BASE_URL || 'http://localhost:5000/api',
      },
    },

    // Role-specific projects
    {
      name: 'property-owner-tests',
      testMatch: /property-owner\/.*.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'test-results/.auth/property-owner.json',
      },
      dependencies: ['setup'],
    },

    {
      name: 'renter-tests',
      testMatch: /renter\/.*.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'test-results/.auth/renter.json',
      },
      dependencies: ['setup'],
    },

    {
      name: 'admin-tests',
      testMatch: /admin\/.*.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'test-results/.auth/admin.json',
      },
      dependencies: ['setup'],
    },
  ],

  // Web server configuration (start app before tests if needed)
  webServer: process.env.START_SERVER === 'true' ? [
    {
      command: 'cd ../frontend && npm start',
      port: 3000,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
      env: {
        NODE_ENV: 'test',
      },
    },
    {
      command: 'cd ../backend/RentManager.API && dotnet run',
      port: 5000,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
      env: {
        ASPNETCORE_ENVIRONMENT: 'Test',
      },
    }
  ] : undefined,

  // Output folder for test artifacts
  outputDir: 'test-results',

  // Global setup/teardown
  globalSetup: require.resolve('./global-setup.ts'),
  globalTeardown: require.resolve('./global-teardown.ts'),
});
