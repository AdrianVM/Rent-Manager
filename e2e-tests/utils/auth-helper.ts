import { Page } from '@playwright/test';

/**
 * Authentication Helper for E2E Tests
 *
 * Provides utilities for authenticating users via Zitadel OIDC
 */

/**
 * Authenticate a user through the OIDC flow
 *
 * @param page - Playwright page object
 * @param email - User email
 * @param password - User password
 * @param baseURL - Application base URL
 */
export async function authenticateUser(
  page: Page,
  email: string,
  password: string,
  baseURL: string = process.env.BASE_URL || 'http://localhost:3000'
) {
  try {
    console.log(`  → Navigating to application: ${baseURL}`);
    await page.goto(baseURL, { waitUntil: 'networkidle' });

    // Check if already authenticated
    const isAuthenticated = await checkIfAuthenticated(page);
    if (isAuthenticated) {
      console.log('  → User already authenticated');
      return;
    }

    // Handle cookie consent banner if present
    console.log('  → Checking for cookie consent banner');
    const acceptAllButton = page.locator('button:has-text("Accept All")');
    if (await acceptAllButton.isVisible().catch(() => false)) {
      console.log('  → Accepting cookies');
      await acceptAllButton.click();
      await page.waitForTimeout(1000);
    }

    // Click "Continue with Zitadel" button on landing page
    console.log('  → Looking for Continue with Zitadel button');
    const zitadelButton = page.locator('button:has-text("Continue with Zitadel")');
    if (await zitadelButton.isVisible().catch(() => false)) {
      console.log('  → Clicking Continue with Zitadel');
      await zitadelButton.click();
    } else {
      // Try alternative login buttons
      console.log('  → Clicking login button');
      await page.click('button:has-text("Login"), a:has-text("Login"), [data-testid="login-button"]', {
        timeout: 10000
      }).catch(() => {
        console.log('  → Login button not found, assuming already on login page');
      });
    }

    // Wait for redirect to Zitadel login page
    console.log('  → Waiting for Zitadel login page');
    await page.waitForURL('**/oauth/v2/**', { timeout: 15000 }).catch(() => {
      console.log('  → Might already be on login form');
    });

    // Fill in email/username
    console.log('  → Entering email');
    const emailSelector = 'input[name="loginName"], input[type="email"], input[autocomplete="username"]';
    await page.waitForSelector(emailSelector, { timeout: 10000 });
    await page.fill(emailSelector, email);

    // Click next/submit button
    console.log('  → Submitting email');
    await page.click('button[type="submit"], button:has-text("Next"), button:has-text("Continue")');

    // Fill in password
    console.log('  → Entering password');
    const passwordSelector = 'input[name="password"], input[type="password"], input[autocomplete="current-password"]';
    await page.waitForSelector(passwordSelector, { timeout: 10000 });
    await page.fill(passwordSelector, password);

    // Submit login form
    console.log('  → Submitting login');
    await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');

    // Wait for redirect back to application
    console.log('  → Waiting for redirect to application');
    await page.waitForURL(`${baseURL}/**`, { timeout: 30000 });

    console.log('  → Authentication successful');

  } catch (error) {
    console.error('  ❌ Authentication failed:', error);
    // Take screenshot for debugging
    await page.screenshot({ path: `test-results/auth-failure-${Date.now()}.png` });
    throw new Error(`Authentication failed for user ${email}: ${error}`);
  }
}

/**
 * Check if user is already authenticated
 *
 * @param page - Playwright page object
 * @returns true if authenticated, false otherwise
 */
export async function checkIfAuthenticated(page: Page): Promise<boolean> {
  try {
    // Check for authentication indicators in your app
    // Adjust these selectors based on your application
    const authIndicators = [
      '[data-testid="user-menu"]',
      '[data-testid="logout-button"]',
      'button:has-text("Logout")',
      '.user-profile',
      '[aria-label="User menu"]'
    ];

    for (const selector of authIndicators) {
      const element = await page.$(selector);
      if (element) {
        return true;
      }
    }

    // Check localStorage for tokens
    const hasTokens = await page.evaluate(() => {
      return !!(
        localStorage.getItem('access_token') ||
        localStorage.getItem('id_token') ||
        sessionStorage.getItem('access_token') ||
        sessionStorage.getItem('id_token')
      );
    });

    return hasTokens;
  } catch (error) {
    return false;
  }
}

/**
 * Logout the current user
 *
 * @param page - Playwright page object
 */
export async function logout(page: Page) {
  try {
    // Click logout button (adjust selector based on your app)
    await page.click('button:has-text("Logout"), a:has-text("Logout"), [data-testid="logout-button"]');

    // Wait for logout to complete
    await page.waitForURL('**/login**', { timeout: 10000 }).catch(() => {
      // Logout might redirect to home page instead
    });

    // Clear all storage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    console.log('  → Logout successful');
  } catch (error) {
    console.error('  ⚠️  Logout failed:', error);
    // Clear storage anyway
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }
}

/**
 * Get the current user's access token
 *
 * @param page - Playwright page object
 * @returns Access token or null if not found
 */
export async function getAccessToken(page: Page): Promise<string | null> {
  return await page.evaluate(() => {
    return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  });
}

/**
 * Get user information from token or API
 *
 * @param page - Playwright page object
 * @returns User information object
 */
export async function getUserInfo(page: Page): Promise<any> {
  const token = await getAccessToken(page);
  if (!token) {
    throw new Error('No access token found');
  }

  // Decode JWT to get user info (basic implementation)
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );

  return JSON.parse(jsonPayload);
}

/**
 * Wait for authentication to complete
 *
 * @param page - Playwright page object
 * @param timeout - Maximum time to wait in milliseconds
 */
export async function waitForAuthentication(page: Page, timeout: number = 30000) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await checkIfAuthenticated(page)) {
      return;
    }
    await page.waitForTimeout(500);
  }

  throw new Error('Authentication timeout');
}
