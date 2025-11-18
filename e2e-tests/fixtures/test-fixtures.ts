import { test as base, Page } from '@playwright/test';
import { createAuthenticatedAPIContext, RentManagerAPI } from '../utils/api-helper';
import { getAccessToken } from '../utils/auth-helper';
import * as testDataFactory from '../utils/test-data-factory';

/**
 * Test Fixtures for Rent Manager E2E Tests
 *
 * Extends Playwright's base test with custom fixtures for:
 * - Authenticated API contexts
 * - Test data factories
 * - Page objects
 * - Common test utilities
 */

type TestFixtures = {
  // Authenticated API context using current page's token
  authenticatedAPI: RentManagerAPI;

  // Test data factories
  testData: typeof testDataFactory;

  // Common test actions
  testActions: TestActions;

  // Screenshot helper
  screenshot: ScreenshotHelper;
};

/**
 * Common test actions
 */
class TestActions {
  constructor(private page: Page) {}

  /**
   * Navigate and wait for page load
   */
  async navigateTo(path: string) {
    const baseURL = process.env.BASE_URL || 'http://localhost:3000';
    await this.page.goto(`${baseURL}${path}`, { waitUntil: 'networkidle' });
  }

  /**
   * Wait for element and click
   */
  async clickAndWait(selector: string, waitForSelector?: string) {
    await this.page.click(selector);
    if (waitForSelector) {
      await this.page.waitForSelector(waitForSelector);
    }
  }

  /**
   * Fill form field and wait
   */
  async fillAndWait(selector: string, value: string, delay: number = 100) {
    await this.page.fill(selector, value);
    await this.page.waitForTimeout(delay);
  }

  /**
   * Wait for API response
   */
  async waitForAPIResponse(urlPattern: string | RegExp, action: () => Promise<void>) {
    const responsePromise = this.page.waitForResponse(
      response => {
        const url = response.url();
        if (typeof urlPattern === 'string') {
          return url.includes(urlPattern);
        }
        return urlPattern.test(url);
      },
      { timeout: 15000 }
    );

    await action();
    return await responsePromise;
  }

  /**
   * Wait for navigation
   */
  async waitForNavigation(action: () => Promise<void>) {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: 'networkidle' }),
      action(),
    ]);
  }

  /**
   * Check if element exists
   */
  async elementExists(selector: string): Promise<boolean> {
    return (await this.page.$(selector)) !== null;
  }

  /**
   * Get element text
   */
  async getElementText(selector: string): Promise<string> {
    return await this.page.textContent(selector) || '';
  }

  /**
   * Get all elements text
   */
  async getAllElementsText(selector: string): Promise<string[]> {
    return await this.page.$$eval(selector, elements =>
      elements.map(el => el.textContent || '')
    );
  }

  /**
   * Wait for element to be visible
   */
  async waitForVisible(selector: string, timeout: number = 10000) {
    await this.page.waitForSelector(selector, { state: 'visible', timeout });
  }

  /**
   * Wait for element to be hidden
   */
  async waitForHidden(selector: string, timeout: number = 10000) {
    await this.page.waitForSelector(selector, { state: 'hidden', timeout });
  }

  /**
   * Reload page and wait
   */
  async reloadAndWait() {
    await this.page.reload({ waitUntil: 'networkidle' });
  }

  /**
   * Wait for loading to complete
   */
  async waitForLoading() {
    // Wait for common loading indicators
    await this.page.waitForSelector(
      '[data-testid="loading"], .loading, .spinner',
      { state: 'hidden', timeout: 30000 }
    ).catch(() => {
      // Loading indicator might not exist, that's ok
    });
  }

  /**
   * Accept browser dialog
   */
  async acceptDialog(action: () => Promise<void>) {
    this.page.once('dialog', dialog => dialog.accept());
    await action();
  }

  /**
   * Dismiss browser dialog
   */
  async dismissDialog(action: () => Promise<void>) {
    this.page.once('dialog', dialog => dialog.dismiss());
    await action();
  }

  /**
   * Upload file
   */
  async uploadFile(selector: string, filePath: string) {
    await this.page.setInputFiles(selector, filePath);
  }

  /**
   * Clear input field
   */
  async clearInput(selector: string) {
    await this.page.fill(selector, '');
  }

  /**
   * Select dropdown option
   */
  async selectOption(selector: string, value: string) {
    await this.page.selectOption(selector, value);
  }

  /**
   * Check checkbox
   */
  async check(selector: string) {
    await this.page.check(selector);
  }

  /**
   * Uncheck checkbox
   */
  async uncheck(selector: string) {
    await this.page.uncheck(selector);
  }

  /**
   * Scroll to element
   */
  async scrollToElement(selector: string) {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }

  /**
   * Hover over element
   */
  async hover(selector: string) {
    await this.page.hover(selector);
  }

  /**
   * Press keyboard key
   */
  async pressKey(key: string) {
    await this.page.keyboard.press(key);
  }

  /**
   * Wait for URL to match pattern
   */
  async waitForURL(pattern: string | RegExp) {
    await this.page.waitForURL(pattern);
  }

  /**
   * Get current URL
   */
  getCurrentURL(): string {
    return this.page.url();
  }

  /**
   * Go back in browser history
   */
  async goBack() {
    await this.page.goBack({ waitUntil: 'networkidle' });
  }

  /**
   * Go forward in browser history
   */
  async goForward() {
    await this.page.goForward({ waitUntil: 'networkidle' });
  }
}

/**
 * Screenshot helper
 */
class ScreenshotHelper {
  constructor(private page: Page) {}

  /**
   * Take full page screenshot
   */
  async takeFullPage(name: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true,
    });
  }

  /**
   * Take screenshot of specific element
   */
  async takeElement(selector: string, name: string) {
    const element = await this.page.$(selector);
    if (element) {
      await element.screenshot({
        path: `test-results/screenshots/${name}-${Date.now()}.png`,
      });
    }
  }

  /**
   * Take screenshot for comparison
   */
  async takeForComparison(name: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true,
    });
  }
}

/**
 * Extended test with custom fixtures
 */
export const test = base.extend<TestFixtures>({
  /**
   * Authenticated API context fixture
   */
  authenticatedAPI: async ({ page }, use) => {
    // Get access token from current page
    const accessToken = await getAccessToken(page);

    if (!accessToken) {
      throw new Error('No access token found. Make sure user is authenticated.');
    }

    // Create authenticated API context
    const apiContext = await createAuthenticatedAPIContext(accessToken);
    const api = new RentManagerAPI(apiContext);

    // Provide API to test
    await use(api);

    // Cleanup
    await apiContext.dispose();
  },

  /**
   * Test data factory fixture
   */
  testData: async ({}, use) => {
    await use(testDataFactory);
  },

  /**
   * Test actions fixture
   */
  testActions: async ({ page }, use) => {
    await use(new TestActions(page));
  },

  /**
   * Screenshot helper fixture
   */
  screenshot: async ({ page }, use) => {
    await use(new ScreenshotHelper(page));
  },
});

export { expect } from '@playwright/test';
