import { Page, Locator } from '@playwright/test';

/**
 * Base Page Object
 *
 * Provides common functionality for all page objects
 * All page objects should extend this class
 */
export abstract class BasePage {
  protected readonly baseURL: string;

  constructor(protected readonly page: Page) {
    this.baseURL = process.env.BASE_URL || 'http://localhost:3000';
  }

  /**
   * Navigate to a specific path
   */
  async goto(path: string = '') {
    const url = path.startsWith('http') ? path : `${this.baseURL}${path}`;
    await this.page.goto(url, { waitUntil: 'networkidle' });
  }

  /**
   * Get current URL
   */
  getCurrentURL(): string {
    return this.page.url();
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Wait for page to load
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for element to be visible
   */
  async waitForElement(selector: string, timeout: number = 10000): Promise<Locator> {
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: 'visible', timeout });
    return locator;
  }

  /**
   * Wait for element to be hidden
   */
  async waitForElementHidden(selector: string, timeout: number = 10000) {
    await this.page.locator(selector).waitFor({ state: 'hidden', timeout });
  }

  /**
   * Click element
   */
  async click(selector: string) {
    await this.page.click(selector);
  }

  /**
   * Click and wait for navigation
   */
  async clickAndNavigate(selector: string) {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: 'networkidle' }),
      this.page.click(selector),
    ]);
  }

  /**
   * Fill input field
   */
  async fill(selector: string, value: string) {
    await this.page.fill(selector, value);
  }

  /**
   * Type into input field (with delay between keystrokes)
   */
  async type(selector: string, value: string, delay: number = 50) {
    await this.page.type(selector, value, { delay });
  }

  /**
   * Clear input field
   */
  async clear(selector: string) {
    await this.page.fill(selector, '');
  }

  /**
   * Select option from dropdown
   */
  async selectOption(selector: string, value: string | { label?: string; value?: string; index?: number }) {
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
   * Get text content of element
   */
  async getText(selector: string): Promise<string> {
    return await this.page.textContent(selector) || '';
  }

  /**
   * Get text content of all matching elements
   */
  async getAllText(selector: string): Promise<string[]> {
    return await this.page.$$eval(selector, elements =>
      elements.map(el => el.textContent || '')
    );
  }

  /**
   * Get attribute value
   */
  async getAttribute(selector: string, attribute: string): Promise<string | null> {
    return await this.page.getAttribute(selector, attribute);
  }

  /**
   * Check if element exists
   */
  async elementExists(selector: string): Promise<boolean> {
    return (await this.page.$(selector)) !== null;
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    return await this.page.isVisible(selector);
  }

  /**
   * Check if element is hidden
   */
  async isHidden(selector: string): Promise<boolean> {
    return await this.page.isHidden(selector);
  }

  /**
   * Check if element is enabled
   */
  async isEnabled(selector: string): Promise<boolean> {
    return await this.page.isEnabled(selector);
  }

  /**
   * Check if element is disabled
   */
  async isDisabled(selector: string): Promise<boolean> {
    return await this.page.isDisabled(selector);
  }

  /**
   * Check if checkbox/radio is checked
   */
  async isChecked(selector: string): Promise<boolean> {
    return await this.page.isChecked(selector);
  }

  /**
   * Hover over element
   */
  async hover(selector: string) {
    await this.page.hover(selector);
  }

  /**
   * Scroll element into view
   */
  async scrollToElement(selector: string) {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }

  /**
   * Press keyboard key
   */
  async pressKey(key: string) {
    await this.page.keyboard.press(key);
  }

  /**
   * Upload file
   */
  async uploadFile(selector: string, filePath: string | string[]) {
    await this.page.setInputFiles(selector, filePath);
  }

  /**
   * Wait for timeout
   */
  async wait(milliseconds: number) {
    await this.page.waitForTimeout(milliseconds);
  }

  /**
   * Wait for API response
   */
  async waitForAPIResponse(urlPattern: string | RegExp, action?: () => Promise<void>) {
    const responsePromise = this.page.waitForResponse(
      response => {
        const url = response.url();
        if (typeof urlPattern === 'string') {
          return url.includes(urlPattern);
        }
        return urlPattern.test(url);
      },
      { timeout: 30000 }
    );

    if (action) {
      await action();
    }

    return await responsePromise;
  }

  /**
   * Wait for loading to complete
   */
  async waitForLoading() {
    // Wait for common loading indicators to disappear
    const loadingSelectors = [
      '[data-testid="loading"]',
      '.loading',
      '.spinner',
      '[aria-busy="true"]',
      '.MuiCircularProgress-root', // Material-UI loading spinner
    ];

    for (const selector of loadingSelectors) {
      try {
        await this.page.waitForSelector(selector, { state: 'hidden', timeout: 2000 });
      } catch {
        // Selector might not exist, that's ok
      }
    }
  }

  /**
   * Reload page
   */
  async reload() {
    await this.page.reload({ waitUntil: 'networkidle' });
  }

  /**
   * Go back
   */
  async goBack() {
    await this.page.goBack({ waitUntil: 'networkidle' });
  }

  /**
   * Go forward
   */
  async goForward() {
    await this.page.goForward({ waitUntil: 'networkidle' });
  }

  /**
   * Take screenshot
   */
  async screenshot(options?: { path?: string; fullPage?: boolean }) {
    return await this.page.screenshot(options);
  }

  /**
   * Execute JavaScript in browser
   */
  async evaluate<T = any>(pageFunction: () => T): Promise<T> {
    return await this.page.evaluate(pageFunction);
  }

  /**
   * Get element count
   */
  async getElementCount(selector: string): Promise<number> {
    return await this.page.locator(selector).count();
  }

  /**
   * Get locator
   */
  locator(selector: string): Locator {
    return this.page.locator(selector);
  }

  /**
   * Handle browser dialog (alert, confirm, prompt)
   */
  async handleDialog(action: 'accept' | 'dismiss', promptText?: string) {
    this.page.once('dialog', async dialog => {
      if (action === 'accept') {
        await dialog.accept(promptText);
      } else {
        await dialog.dismiss();
      }
    });
  }

  /**
   * Wait for URL to match pattern
   */
  async waitForURL(pattern: string | RegExp, timeout: number = 30000) {
    await this.page.waitForURL(pattern, { timeout });
  }

  /**
   * Get inner HTML
   */
  async getInnerHTML(selector: string): Promise<string> {
    return await this.page.innerHTML(selector);
  }

  /**
   * Get input value
   */
  async getInputValue(selector: string): Promise<string> {
    return await this.page.inputValue(selector);
  }

  /**
   * Focus element
   */
  async focus(selector: string) {
    await this.page.focus(selector);
  }

  /**
   * Blur element
   */
  async blur(selector: string) {
    await this.page.evaluate((sel) => {
      const element = document.querySelector(sel) as HTMLElement;
      if (element) element.blur();
    }, selector);
  }

  /**
   * Double click
   */
  async doubleClick(selector: string) {
    await this.page.dblclick(selector);
  }

  /**
   * Right click
   */
  async rightClick(selector: string) {
    await this.page.click(selector, { button: 'right' });
  }

  /**
   * Drag and drop
   */
  async dragAndDrop(sourceSelector: string, targetSelector: string) {
    await this.page.dragAndDrop(sourceSelector, targetSelector);
  }

  /**
   * Get all matching elements as locators
   */
  getAllLocators(selector: string): Locator {
    return this.page.locator(selector);
  }

  /**
   * Wait for selector to appear
   */
  async waitForSelector(selector: string, timeout: number = 10000) {
    await this.page.waitForSelector(selector, { timeout });
  }

  /**
   * Get bounding box of element
   */
  async getBoundingBox(selector: string) {
    const element = await this.page.$(selector);
    return element ? await element.boundingBox() : null;
  }

  /**
   * Check if text is present on page
   */
  async hasText(text: string): Promise<boolean> {
    return await this.page.locator(`text=${text}`).count() > 0;
  }

  /**
   * Get all cookies
   */
  async getCookies() {
    return await this.page.context().cookies();
  }

  /**
   * Set cookie
   */
  async setCookie(name: string, value: string) {
    await this.page.context().addCookies([{
      name,
      value,
      domain: new URL(this.baseURL).hostname,
      path: '/',
    }]);
  }

  /**
   * Clear all cookies
   */
  async clearCookies() {
    await this.page.context().clearCookies();
  }

  /**
   * Get local storage item
   */
  async getLocalStorageItem(key: string): Promise<string | null> {
    return await this.page.evaluate((k) => localStorage.getItem(k), key);
  }

  /**
   * Set local storage item
   */
  async setLocalStorageItem(key: string, value: string) {
    await this.page.evaluate(
      ({ k, v }) => localStorage.setItem(k, v),
      { k: key, v: value }
    );
  }

  /**
   * Clear local storage
   */
  async clearLocalStorage() {
    await this.page.evaluate(() => localStorage.clear());
  }

  /**
   * Get session storage item
   */
  async getSessionStorageItem(key: string): Promise<string | null> {
    return await this.page.evaluate((k) => sessionStorage.getItem(k), key);
  }

  /**
   * Set session storage item
   */
  async setSessionStorageItem(key: string, value: string) {
    await this.page.evaluate(
      ({ k, v }) => sessionStorage.setItem(k, v),
      { k: key, v: value }
    );
  }

  /**
   * Clear session storage
   */
  async clearSessionStorage() {
    await this.page.evaluate(() => sessionStorage.clear());
  }
}
