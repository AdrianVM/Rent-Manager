import React, { useState } from 'react';
import CookiePreferences from '../../components/CookieConsent/CookiePreferences';
import './CookiePolicy.css';

const CookiePolicy = () => {
  const [showPreferences, setShowPreferences] = useState(false);

  const handlePreferencesSaved = () => {
    setShowPreferences(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="cookie-policy-page">
      <div className="cookie-policy-container">
        <header className="cookie-policy-header">
          <h1>Cookie Policy</h1>
          <p className="cookie-policy-last-updated">Last Updated: November 13, 2025</p>
        </header>

        <div className="cookie-policy-content">
          <section className="cookie-policy-section">
            <h2>1. Introduction</h2>
            <p>
              This Cookie Policy explains how RentFlow Property Management ("we", "us", or "our")
              uses cookies and similar technologies when you use our application. This policy
              provides you with clear and comprehensive information about the cookies we use
              and the purposes for using them.
            </p>
            <p>
              By using our application, you acknowledge that you have read and understood this
              Cookie Policy. If you do not agree with this policy, you should adjust your cookie
              preferences or discontinue use of our application.
            </p>
          </section>

          <section className="cookie-policy-section">
            <h2>2. What Are Cookies?</h2>
            <p>
              Cookies are small text files that are placed on your device (computer, smartphone,
              or tablet) when you visit a website or use a web application. They are widely used
              to make applications work more efficiently and provide useful information to the
              owners of the application.
            </p>
            <p>
              Cookies can be "session cookies" (which are deleted when you close your browser)
              or "persistent cookies" (which remain on your device for a set period or until
              you delete them).
            </p>
          </section>

          <section className="cookie-policy-section">
            <h2>3. How We Use Cookies</h2>
            <p>
              We use cookies and similar storage technologies (such as localStorage and
              sessionStorage) for several important purposes:
            </p>
            <ul>
              <li>To enable essential features like authentication and security</li>
              <li>To remember your preferences and settings</li>
              <li>To understand how you use our application</li>
              <li>To improve our services and user experience</li>
            </ul>
          </section>

          <section className="cookie-policy-section">
            <h2>4. Types of Cookies We Use</h2>

            <div className="cookie-category-detail">
              <h3>4.1 Strictly Necessary Cookies</h3>
              <span className="cookie-badge required">Required - Always Active</span>
              <p>
                These cookies are essential for the application to function properly. They enable
                core functionality such as security, authentication, and session management.
                Without these cookies, services you have requested cannot be provided.
              </p>
              <p><strong>Legal Basis:</strong> Legitimate Interest (Article 6(1)(f) GDPR)</p>
              <div className="cookie-table-wrapper">
                <table className="cookie-table">
                  <thead>
                    <tr>
                      <th>Cookie Name</th>
                      <th>Purpose</th>
                      <th>Duration</th>
                      <th>Provider</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>oidc.user</code></td>
                      <td>Stores OAuth/OpenID Connect authentication state and tokens</td>
                      <td>Session</td>
                      <td>RentFlow (First-party)</td>
                    </tr>
                    <tr>
                      <td><code>Authentication Session</code></td>
                      <td>Maintains your logged-in state and session security</td>
                      <td>Session</td>
                      <td>RentFlow (First-party)</td>
                    </tr>
                    <tr>
                      <td><code>XSRF-TOKEN</code></td>
                      <td>Protection against cross-site request forgery (CSRF) attacks</td>
                      <td>Session</td>
                      <td>RentFlow (First-party)</td>
                    </tr>
                    <tr>
                      <td><code>cookieConsentToken</code></td>
                      <td>Tracks your cookie consent preferences</td>
                      <td>12 months</td>
                      <td>RentFlow (First-party)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="cookie-category-detail">
              <h3>4.2 Functional Cookies</h3>
              <span className="cookie-badge optional">Optional</span>
              <p>
                These cookies enable enhanced functionality and personalization. They allow us
                to remember your preferences such as your selected role, language, and theme
                settings. If you disable these cookies, some or all of these personalization
                features may not function properly.
              </p>
              <p><strong>Legal Basis:</strong> Consent (Article 6(1)(a) GDPR)</p>
              <div className="cookie-table-wrapper">
                <table className="cookie-table">
                  <thead>
                    <tr>
                      <th>Cookie Name</th>
                      <th>Purpose</th>
                      <th>Duration</th>
                      <th>Provider</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>activeRole</code></td>
                      <td>Remembers your selected user role (Admin, Property Owner, Renter)</td>
                      <td>Persistent</td>
                      <td>RentFlow (First-party)</td>
                    </tr>
                    <tr>
                      <td><code>rentManager_theme</code></td>
                      <td>Remembers your theme preference (light or dark mode)</td>
                      <td>Persistent</td>
                      <td>RentFlow (First-party)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="cookie-category-detail">
              <h3>4.3 Performance Cookies</h3>
              <span className="cookie-badge optional">Optional - Not Currently Used</span>
              <p>
                These cookies help us understand how visitors interact with our application by
                collecting and reporting information anonymously. This helps us improve the
                performance and usability of our services.
              </p>
              <p><strong>Legal Basis:</strong> Consent (Article 6(1)(a) GDPR)</p>
              <p className="cookie-not-used">
                <em>Performance cookies are not currently implemented in our application but may
                be added in the future. We will update this policy and request your consent
                before implementing any analytics or performance tracking.</em>
              </p>
            </div>

            <div className="cookie-category-detail">
              <h3>4.4 Marketing Cookies</h3>
              <span className="cookie-badge optional">Optional - Not Currently Used</span>
              <p>
                These cookies may be used to track your activity across websites and build a
                profile of your interests to show you relevant advertisements on other sites.
              </p>
              <p><strong>Legal Basis:</strong> Consent (Article 6(1)(a) GDPR)</p>
              <p className="cookie-not-used">
                <em>Marketing cookies are not currently implemented in our application. We do
                not currently use any advertising or marketing tracking technologies.</em>
              </p>
            </div>
          </section>

          <section className="cookie-policy-section">
            <h2>5. Third-Party Cookies</h2>
            <p>
              We may use services provided by third parties, which may set their own cookies
              on your device. Currently, we use:
            </p>
            <ul>
              <li>
                <strong>Zitadel (Authentication Provider):</strong> For secure OAuth 2.0 /
                OpenID Connect authentication
              </li>
              <li>
                <strong>Stripe (Payment Processing):</strong> For secure payment processing
                (when you initiate a payment)
              </li>
            </ul>
            <p>
              These third parties have their own privacy policies and cookie policies. We
              recommend reviewing their policies:
            </p>
            <ul>
              <li>
                <a href="https://zitadel.com/privacy-policy" target="_blank" rel="noopener noreferrer">
                  Zitadel Privacy Policy
                </a>
              </li>
              <li>
                <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">
                  Stripe Privacy Policy
                </a>
              </li>
            </ul>
          </section>

          <section className="cookie-policy-section">
            <h2>6. Your Cookie Choices</h2>
            <p>
              You have several options for managing cookies:
            </p>

            <div className="cookie-choice-card">
              <h4>Manage Cookie Preferences</h4>
              <p>
                You can manage your cookie preferences at any time by clicking the button below.
                This allows you to enable or disable optional cookies while keeping strictly
                necessary cookies active.
              </p>
              <button
                className="cookie-policy-btn"
                onClick={() => setShowPreferences(true)}
              >
                Manage Cookie Preferences
              </button>
            </div>

            <div className="cookie-choice-card">
              <h4>Browser Settings</h4>
              <p>
                Most web browsers allow you to control cookies through their settings. You can
                typically find these in the "Options" or "Preferences" menu of your browser.
                However, note that blocking strictly necessary cookies may prevent you from
                using the application.
              </p>
              <ul>
                <li>
                  <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">
                    Google Chrome
                  </a>
                </li>
                <li>
                  <a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer">
                    Mozilla Firefox
                  </a>
                </li>
                <li>
                  <a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer">
                    Safari
                  </a>
                </li>
                <li>
                  <a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">
                    Microsoft Edge
                  </a>
                </li>
              </ul>
            </div>
          </section>

          <section className="cookie-policy-section">
            <h2>7. Data Protection and Privacy</h2>
            <p>
              We are committed to protecting your privacy and personal data in accordance with
              the General Data Protection Regulation (GDPR) and other applicable data protection
              laws. Cookie data is treated as personal data when it can be used to identify you.
            </p>
            <p><strong>Your Rights Under GDPR:</strong></p>
            <ul>
              <li><strong>Right to Access:</strong> You can request information about the cookies we use</li>
              <li><strong>Right to Rectification:</strong> You can correct your cookie preferences</li>
              <li><strong>Right to Erasure:</strong> You can withdraw consent and delete cookies</li>
              <li><strong>Right to Restriction:</strong> You can limit how we use certain cookies</li>
              <li><strong>Right to Object:</strong> You can object to non-essential cookies</li>
              <li><strong>Right to Data Portability:</strong> You can request your cookie consent data</li>
            </ul>
            <p>
              To exercise any of these rights, please contact us using the information provided
              in Section 10.
            </p>
          </section>

          <section className="cookie-policy-section">
            <h2>8. Cookie Consent Duration</h2>
            <p>
              Your cookie consent preferences are stored for 12 months. After this period, we
              will ask for your consent again. You can withdraw or modify your consent at any
              time before this period expires by using the "Manage Cookie Preferences" option.
            </p>
          </section>

          <section className="cookie-policy-section">
            <h2>9. Changes to This Cookie Policy</h2>
            <p>
              We may update this Cookie Policy from time to time to reflect changes in our
              practices, technologies, legal requirements, or for other operational reasons.
              When we make significant changes, we will notify you by:
            </p>
            <ul>
              <li>Updating the "Last Updated" date at the top of this policy</li>
              <li>Displaying a notification in the application</li>
              <li>Requesting renewed consent if required by law</li>
            </ul>
            <p>
              We encourage you to review this policy periodically to stay informed about how
              we use cookies.
            </p>
          </section>

          <section className="cookie-policy-section">
            <h2>10. Contact Us</h2>
            <p>
              If you have any questions about this Cookie Policy or our use of cookies, please
              contact us:
            </p>
            <div className="contact-info">
              <p><strong>Email:</strong> privacy@rentflow.com</p>
              <p><strong>Data Protection Officer:</strong> dpo@rentflow.com</p>
            </div>
            <p>
              For more information about how we process your personal data, please refer to our
              <a href="/privacy-policy"> Privacy Policy</a>.
            </p>
          </section>
        </div>
      </div>

      {showPreferences && (
        <CookiePreferences
          onSave={handlePreferencesSaved}
          onClose={() => setShowPreferences(false)}
        />
      )}
    </div>
  );
};

export default CookiePolicy;
