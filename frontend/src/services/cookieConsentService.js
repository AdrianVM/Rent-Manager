import authService from './authService';

const API_URL = process.env.REACT_APP_API_URL;
const CONSENT_TOKEN_KEY = 'cookieConsentToken';
const CONSENT_PREFERENCES_KEY = 'cookieConsent';

class CookieConsentService {
  constructor() {
    this.consentToken = this.getConsentToken();
    this.preferences = null;
  }

  /**
   * Get or create a consent token for anonymous users
   */
  getConsentToken() {
    let token = localStorage.getItem(CONSENT_TOKEN_KEY);
    if (!token) {
      token = this.generateToken();
      localStorage.setItem(CONSENT_TOKEN_KEY, token);
    }
    return token;
  }

  /**
   * Generate a unique consent token
   */
  generateToken() {
    return 'consent_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get current consent preferences from backend
   */
  async getConsent() {
    try {
      const headers = authService.isAuthenticated()
        ? authService.getAuthHeaders()
        : { 'Content-Type': 'application/json' };

      const url = authService.isAuthenticated()
        ? `${API_URL}/CookieConsent`
        : `${API_URL}/CookieConsent?consentToken=${this.consentToken}`;

      const response = await fetch(url, { headers });

      if (response.ok) {
        const consent = await response.json();
        this.preferences = consent;
        // Cache locally
        localStorage.setItem(CONSENT_PREFERENCES_KEY, JSON.stringify(consent));
        return consent;
      }

      // Return defaults if not found
      return this.getDefaultConsent();
    } catch (error) {
      console.error('Error fetching cookie consent:', error);
      // Return cached or default
      return this.getCachedConsent() || this.getDefaultConsent();
    }
  }

  /**
   * Get cached consent preferences
   */
  getCachedConsent() {
    try {
      const cached = localStorage.getItem(CONSENT_PREFERENCES_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('Error reading cached consent:', error);
    }
    return null;
  }

  /**
   * Save consent preferences
   */
  async saveConsent(preferences) {
    try {
      const headers = authService.isAuthenticated()
        ? authService.getAuthHeaders()
        : { 'Content-Type': 'application/json' };

      const payload = {
        functional: preferences.functional || false,
        performance: preferences.performance || false,
        marketing: preferences.marketing || false,
        consentToken: authService.isAuthenticated() ? null : this.consentToken
      };

      const response = await fetch(`${API_URL}/CookieConsent`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const consent = await response.json();
        this.preferences = consent;
        localStorage.setItem(CONSENT_PREFERENCES_KEY, JSON.stringify(consent));
        this.applyConsent(consent);
        return consent;
      }

      throw new Error('Failed to save consent');
    } catch (error) {
      console.error('Error saving cookie consent:', error);
      throw error;
    }
  }

  /**
   * Withdraw all consent (except strictly necessary)
   */
  async withdrawConsent() {
    return this.saveConsent({
      functional: false,
      performance: false,
      marketing: false
    });
  }

  /**
   * Accept all cookies
   */
  async acceptAll() {
    return this.saveConsent({
      functional: true,
      performance: true,
      marketing: true
    });
  }

  /**
   * Accept only necessary cookies
   */
  async acceptNecessaryOnly() {
    return this.saveConsent({
      functional: false,
      performance: false,
      marketing: false
    });
  }

  /**
   * Check if consent has been given
   */
  hasConsented() {
    const cached = this.getCachedConsent();
    return cached !== null;
  }

  /**
   * Check if consent has expired
   */
  isConsentExpired() {
    const cached = this.getCachedConsent();
    if (!cached || !cached.expiryDate) return true;

    const expiryDate = new Date(cached.expiryDate);
    return expiryDate < new Date();
  }

  /**
   * Check if consent banner should be shown
   */
  shouldShowBanner() {
    return !this.hasConsented() || this.isConsentExpired();
  }

  /**
   * Get default consent (only strictly necessary)
   */
  getDefaultConsent() {
    return {
      strictlyNecessary: true,
      functional: false,
      performance: false,
      marketing: false,
      consentDate: new Date().toISOString(),
      expiryDate: new Date().toISOString(),
      policyVersion: '1.0'
    };
  }

  /**
   * Apply consent preferences (cleanup cookies/storage based on preferences)
   */
  applyConsent(preferences) {
    // If functional cookies are disabled, remove preference-related items
    if (!preferences.functional) {
      // Keep only essential items, remove optional preferences
      const essentialKeys = [
        CONSENT_TOKEN_KEY,
        CONSENT_PREFERENCES_KEY,
        'oidc.user'  // Authentication is strictly necessary
      ];

      // Remove non-essential localStorage items
      Object.keys(localStorage).forEach(key => {
        if (!essentialKeys.some(essential => key.includes(essential))) {
          localStorage.removeItem(key);
        }
      });
    }

    // Performance cookies - future analytics integration
    if (!preferences.performance) {
      // Disable analytics if implemented
      if (window.gtag) {
        window.gtag('consent', 'update', {
          analytics_storage: 'denied'
        });
      }
    }

    // Marketing cookies
    if (!preferences.marketing) {
      // Disable marketing/advertising cookies if implemented
      if (window.gtag) {
        window.gtag('consent', 'update', {
          ad_storage: 'denied'
        });
      }
    }
  }

  /**
   * Get cookie policy information
   */
  async getCookiePolicy() {
    try {
      const response = await fetch(`${API_URL}/CookieConsent/policy`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error fetching cookie policy:', error);
    }
    return null;
  }

  /**
   * Clear all consent data (for testing)
   */
  clearConsent() {
    localStorage.removeItem(CONSENT_TOKEN_KEY);
    localStorage.removeItem(CONSENT_PREFERENCES_KEY);
    this.preferences = null;
    this.consentToken = this.generateToken();
  }
}

const cookieConsentService = new CookieConsentService();
export default cookieConsentService;
