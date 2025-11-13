import React, { useState, useEffect } from 'react';
import cookieConsentService from '../../services/cookieConsentService';
import './CookiePreferences.css';

const CookiePreferences = ({ onSave, onClose }) => {
  const [preferences, setPreferences] = useState({
    strictlyNecessary: true,
    functional: false,
    performance: false,
    marketing: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCurrentPreferences();
  }, []);

  const loadCurrentPreferences = async () => {
    try {
      const current = await cookieConsentService.getConsent();
      setPreferences({
        strictlyNecessary: current.strictlyNecessary,
        functional: current.functional,
        performance: current.performance,
        marketing: current.marketing
      });
    } catch (err) {
      console.error('Error loading preferences:', err);
    }
  };

  const handleToggle = (category) => {
    // Strictly necessary cannot be toggled
    if (category === 'strictlyNecessary') return;

    setPreferences(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      await cookieConsentService.saveConsent(preferences);
      if (onSave) {
        onSave(preferences);
      }
    } catch (err) {
      setError('Failed to save preferences. Please try again.');
      console.error('Error saving preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptAll = async () => {
    setLoading(true);
    setError(null);

    try {
      await cookieConsentService.acceptAll();
      if (onSave) {
        onSave({ functional: true, performance: true, marketing: true });
      }
    } catch (err) {
      setError('Failed to save preferences. Please try again.');
      console.error('Error accepting all:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cookie-preferences-overlay">
      <div className="cookie-preferences-modal">
        <div className="cookie-preferences-header">
          <h2>Manage Cookie Preferences</h2>
          <button
            className="cookie-preferences-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="cookie-preferences-body">
          <p className="cookie-preferences-intro">
            Choose which types of cookies you want to allow. You can change these
            settings at any time from the Cookie Policy page.
          </p>

          {error && (
            <div className="cookie-preferences-error">
              {error}
            </div>
          )}

          <div className="cookie-preference-item">
            <div className="cookie-preference-header">
              <div className="cookie-preference-info">
                <h3>Strictly Necessary Cookies</h3>
                <span className="cookie-preference-badge required">Always Active</span>
              </div>
              <label className="cookie-preference-toggle disabled">
                <input
                  type="checkbox"
                  checked={preferences.strictlyNecessary}
                  disabled
                  readOnly
                />
                <span className="cookie-preference-slider"></span>
              </label>
            </div>
            <p className="cookie-preference-description">
              These cookies are essential for the application to function properly.
              They enable authentication, security features, and core functionality.
              These cookies cannot be disabled.
            </p>
            <details className="cookie-preference-details">
              <summary>View Cookies</summary>
              <ul>
                <li><strong>oidc.user:</strong> OAuth/OpenID Connect authentication state (Session)</li>
                <li><strong>Authentication Session:</strong> Maintains logged-in state (Session)</li>
                <li><strong>XSRF-TOKEN:</strong> CSRF protection (Session)</li>
              </ul>
            </details>
          </div>

          <div className="cookie-preference-item">
            <div className="cookie-preference-header">
              <div className="cookie-preference-info">
                <h3>Functional Cookies</h3>
                <span className="cookie-preference-badge optional">Optional</span>
              </div>
              <label className="cookie-preference-toggle">
                <input
                  type="checkbox"
                  checked={preferences.functional}
                  onChange={() => handleToggle('functional')}
                />
                <span className="cookie-preference-slider"></span>
              </label>
            </div>
            <p className="cookie-preference-description">
              These cookies remember your preferences and settings, such as your
              selected role and theme preference. Disabling these will reset your
              preferences on each visit.
            </p>
            <details className="cookie-preference-details">
              <summary>View Cookies</summary>
              <ul>
                <li><strong>activeRole:</strong> Remembers your selected user role (Persistent)</li>
                <li><strong>rentManager_theme:</strong> Remembers theme preference (Persistent)</li>
              </ul>
            </details>
          </div>

          <div className="cookie-preference-item">
            <div className="cookie-preference-header">
              <div className="cookie-preference-info">
                <h3>Performance Cookies</h3>
                <span className="cookie-preference-badge optional">Optional</span>
              </div>
              <label className="cookie-preference-toggle">
                <input
                  type="checkbox"
                  checked={preferences.performance}
                  onChange={() => handleToggle('performance')}
                />
                <span className="cookie-preference-slider"></span>
              </label>
            </div>
            <p className="cookie-preference-description">
              These cookies help us understand how visitors interact with our
              application by collecting and reporting information anonymously.
              Currently not in use.
            </p>
            <details className="cookie-preference-details">
              <summary>View Cookies</summary>
              <ul>
                <li><em>Not currently implemented</em></li>
              </ul>
            </details>
          </div>

          <div className="cookie-preference-item">
            <div className="cookie-preference-header">
              <div className="cookie-preference-info">
                <h3>Marketing Cookies</h3>
                <span className="cookie-preference-badge optional">Optional</span>
              </div>
              <label className="cookie-preference-toggle">
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={() => handleToggle('marketing')}
                />
                <span className="cookie-preference-slider"></span>
              </label>
            </div>
            <p className="cookie-preference-description">
              These cookies may be used to show relevant content and advertisements.
              Currently not in use.
            </p>
            <details className="cookie-preference-details">
              <summary>View Cookies</summary>
              <ul>
                <li><em>Not currently implemented</em></li>
              </ul>
            </details>
          </div>
        </div>

        <div className="cookie-preferences-footer">
          <button
            className="cookie-preferences-btn cookie-preferences-btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="cookie-preferences-btn cookie-preferences-btn-primary"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Preferences'}
          </button>
          <button
            className="cookie-preferences-btn cookie-preferences-btn-accept"
            onClick={handleAcceptAll}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Accept All'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookiePreferences;
