import React, { useState } from 'react';
import authService from '../services/authService';
import { PrimaryButton } from '../components/common';

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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-secondary)',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: 'var(--primary-color)', marginBottom: '10px' }}>
            AVM Property Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Sign in to your account
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fee',
            color: '#c53030',
            padding: '10px',
            borderRadius: '6px',
            marginBottom: '20px',
            border: '1px solid #feb2b2'
          }}>
            {error}
          </div>
        )}

        {/* Zitadel OAuth Login */}
        <PrimaryButton
          onClick={handleZitadelLogin}
          disabled={loading}
          style={{
            width: '100%',
            background: '#5469D4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white"/>
            <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {loading ? 'Redirecting...' : 'Sign in with Zitadel'}
        </PrimaryButton>
      </div>
    </div>
  );
}

export default Login;
