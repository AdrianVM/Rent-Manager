import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import zitadelAuthService from '../services/zitadelAuth';

function AuthCallback({ onAuthSuccess }) {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Process the callback from Zitadel
        const returnUrl = await zitadelAuthService.handleCallback();

        // Get user profile
        const userProfile = zitadelAuthService.getProfile();

        // Update App.js state with user info
        if (onAuthSuccess && userProfile) {
          onAuthSuccess(userProfile);
        }

        // Get the user's role-based dashboard
        const dashboardPath = zitadelAuthService.getDashboardPath();

        // Always use role-based dashboard unless there's a meaningful return URL
        const redirectPath = (returnUrl &&
                             returnUrl !== '/' &&
                             returnUrl !== '/login' &&
                             returnUrl !== null &&
                             !returnUrl.includes('/auth/'))
                             ? returnUrl
                             : dashboardPath;

        navigate(redirectPath, { replace: true });
      } catch (err) {
        console.error('Authentication callback error:', err);
        setError(err.message || 'Authentication failed');

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      }
    };

    handleCallback();
  }, [navigate, onAuthSuccess]);

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-color)'
      }}>
        <div className="card" style={{ maxWidth: '500px', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--error-color)', marginBottom: '15px' }}>Authentication Error</h2>
          <p style={{ color: 'var(--text-primary)' }}>{error}</p>
          <p style={{ color: 'var(--text-secondary)', marginTop: '15px' }}>
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-color)'
    }}>
      <div className="card" style={{ textAlign: 'center' }}>
        <h2 style={{ color: 'var(--primary-color)', marginBottom: '15px' }}>
          Completing sign-in...
        </h2>
        <div style={{
          width: '40px',
          height: '40px',
          margin: '0 auto',
          border: '4px solid var(--primary-color)',
          borderTop: '4px solid transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    </div>
  );
}

export default AuthCallback;
