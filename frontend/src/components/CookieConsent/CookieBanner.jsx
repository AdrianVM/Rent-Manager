import React, { useState } from 'react';
import './CookieBanner.css';

const CookieBanner = ({ onAcceptAll, onAcceptNecessary, onCustomize, onClose }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="cookie-banner-overlay">
      <div className="cookie-banner">
        <div className="cookie-banner-content">
          <div className="cookie-banner-header">
            <h3>Your Privacy Choices</h3>
            <button
              className="cookie-banner-close"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="cookie-banner-body">
            <p>
              We use cookies and similar technologies to enhance your experience,
              remember your preferences, and understand how you use our application.
              Some cookies are essential for the application to function, while others
              help us improve our services.
            </p>

            {showDetails && (
              <div className="cookie-details">
                <div className="cookie-category">
                  <h4>Strictly Necessary Cookies</h4>
                  <p className="cookie-category-required">(Always Active)</p>
                  <p className="cookie-category-description">
                    These cookies are essential for authentication, security, and core
                    functionality. They cannot be disabled.
                  </p>
                </div>

                <div className="cookie-category">
                  <h4>Functional Cookies</h4>
                  <p className="cookie-category-optional">(Optional)</p>
                  <p className="cookie-category-description">
                    Remember your preferences like theme, language, and selected role.
                    Disabling these will reset your preferences on each visit.
                  </p>
                </div>

                <div className="cookie-category">
                  <h4>Performance Cookies</h4>
                  <p className="cookie-category-optional">(Optional)</p>
                  <p className="cookie-category-description">
                    Help us understand how you use the application so we can improve
                    performance and user experience. Currently not in use.
                  </p>
                </div>

                <div className="cookie-category">
                  <h4>Marketing Cookies</h4>
                  <p className="cookie-category-optional">(Optional)</p>
                  <p className="cookie-category-description">
                    Used to show relevant content and advertisements. Currently not in use.
                  </p>
                </div>
              </div>
            )}

            <button
              className="cookie-banner-toggle-details"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>
          </div>

          <div className="cookie-banner-footer">
            <button
              className="cookie-banner-btn cookie-banner-btn-necessary"
              onClick={onAcceptNecessary}
            >
              Accept Necessary Only
            </button>
            <button
              className="cookie-banner-btn cookie-banner-btn-customize"
              onClick={onCustomize}
            >
              Customize
            </button>
            <button
              className="cookie-banner-btn cookie-banner-btn-accept"
              onClick={onAcceptAll}
            >
              Accept All
            </button>
          </div>

          <div className="cookie-banner-links">
            <a href="/cookie-policy" target="_blank" rel="noopener noreferrer">
              Cookie Policy
            </a>
            {' | '}
            <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
