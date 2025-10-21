import React, { useState } from 'react';
import authService from '../services/authService';
import './Login.css';

function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleZitadelLogin = async () => {
    setLoading(true);
    setError('');

    try {
      await authService.loginWithZitadel();
      // User will be redirected to Zitadel, then back to callback page
    } catch (error) {
      setError(error.message || 'OAuth login failed');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Animated background gradient */}
      <div className="login-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      {/* Main content */}
      <div className="login-content">
        {/* Logo and branding */}
        <div className="login-header">
          <div className="login-logo">
            <div className="logo-icon">
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="56" height="56" rx="12" fill="url(#gradient)" />
                <path d="M28 14L18 20L28 26L38 20L28 14Z" fill="white" fillOpacity="0.9"/>
                <path d="M18 36L28 42L38 36" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.9"/>
                <path d="M18 28L28 34L38 28" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.9"/>
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#1F4E79"/>
                    <stop offset="1" stopColor="#1CA9A3"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 className="login-title">AVM</h1>
          </div>
          <p className="login-subtitle">Property Management</p>
        </div>

        {/* Login card with glassmorphism */}
        <div className="login-card">
          <div className="login-card-content">
            <h2 className="welcome-text">Welcome back</h2>
            <p className="welcome-subtitle">Sign in to continue to your account</p>

            {error && (
              <div className="login-error">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z" fill="currentColor"/>
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button
              className="login-button"
              onClick={handleZitadelLogin}
              disabled={loading}
            >
              {loading ? (
                <div className="login-spinner">
                  <div className="spinner"></div>
                  <span>Connecting...</span>
                </div>
              ) : (
                <>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Continue with Zitadel</span>
                  <svg className="arrow-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </>
              )}
            </button>

            <div className="login-divider">
              <span>Secure authentication</span>
            </div>

            <div className="login-features">
              <div className="feature-item">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 0L2 3L8 6L14 3L8 0Z" fill="currentColor"/>
                  <path d="M2 10L8 13L14 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 7L8 10L14 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>End-to-end encrypted</span>
              </div>
              <div className="feature-item">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 1L3 3.5V7.5C3 10.5 5 13 8 14.5C11 13 13 10.5 13 7.5V3.5L8 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 8L7.5 9.5L10.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>OAuth 2.0 protected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <p>Your data is protected with industry-leading security standards</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
