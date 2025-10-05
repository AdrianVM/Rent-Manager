import React, { useState } from 'react';
import authService from '../services/authService';
import { PrimaryButton, SecondaryButton } from '../components/common';

function Login({ onLoginSuccess }) {
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [isLogin, setIsLogin] = useState(true);
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Renter'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await authService.login(loginData.email, loginData.password);
    
    if (result.success) {
      onLoginSuccess(result.user);
    } else {
      setError(result.error || 'Login failed');
    }
    
    setLoading(false);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await authService.register(registerData);
    
    if (result.success) {
      setIsLogin(true);
      setError('');
      alert('Registration successful! Please login with your credentials.');
    } else {
      setError(result.error || 'Registration failed');
    }
    
    setLoading(false);
  };

  const handleLoginChange = (e) => {
    setLoginData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleRegisterChange = (e) => {
    setRegisterData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const quickLogin = async (userType) => {
    setLoading(true);
    setError('');

    const credentials = {
      'admin': { email: 'admin@rentmanager.com', password: 'admin123' },
      'owner': { email: 'owner@rentmanager.com', password: 'owner123' },
      'renter': { email: 'renter@rentmanager.com', password: 'renter123' }
    };

    const creds = credentials[userType];
    const result = await authService.login(creds.email, creds.password);
    
    if (result.success) {
      onLoginSuccess(result.user);
    } else {
      setError(result.error || 'Quick login failed');
    }
    
    setLoading(false);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: 'var(--bg-color)',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
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
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
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

        {isLogin ? (
          <form onSubmit={handleLoginSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-primary)' }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                value={loginData.email}
                onChange={handleLoginChange}
                className="form-control"
                required
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-primary)' }}>
                Password
              </label>
              <input
                type="password"
                name="password"
                value={loginData.password}
                onChange={handleLoginChange}
                className="form-control"
                required
                style={{ width: '100%' }}
              />
            </div>
            <PrimaryButton
              type="submit"
              disabled={loading}
              style={{ width: '100%', marginBottom: '20px' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </PrimaryButton>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-primary)' }}>
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={registerData.name}
                onChange={handleRegisterChange}
                className="form-control"
                required
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-primary)' }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                value={registerData.email}
                onChange={handleRegisterChange}
                className="form-control"
                required
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-primary)' }}>
                Password
              </label>
              <input
                type="password"
                name="password"
                value={registerData.password}
                onChange={handleRegisterChange}
                className="form-control"
                required
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-primary)' }}>
                Role
              </label>
              <select
                name="role"
                value={registerData.role}
                onChange={handleRegisterChange}
                className="form-control"
                style={{ width: '100%' }}
              >
                <option value="Renter">Renter</option>
                <option value="PropertyOwner">Property Owner</option>
              </select>
            </div>
            <PrimaryButton
              type="submit"
              disabled={loading}
              style={{ width: '100%', marginBottom: '20px' }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </PrimaryButton>
          </form>
        )}

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary-color)',
              textDecoration: 'underline',
              cursor: 'pointer'
            }}
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>

        {isLogin && (
          <div>
            <div style={{ 
              borderTop: '1px solid var(--border-color)', 
              paddingTop: '20px',
              textAlign: 'center'
            }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '15px' }}>
                Quick login for demo:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <SecondaryButton
                  onClick={() => quickLogin('admin')}
                  disabled={loading}
                  style={{ fontSize: '14px', padding: '8px 12px' }}
                >
                  Admin Demo
                </SecondaryButton>
                <SecondaryButton
                  onClick={() => quickLogin('owner')}
                  disabled={loading}
                  style={{ fontSize: '14px', padding: '8px 12px' }}
                >
                  Property Owner Demo
                </SecondaryButton>
                <SecondaryButton
                  onClick={() => quickLogin('renter')}
                  disabled={loading}
                  style={{ fontSize: '14px', padding: '8px 12px' }}
                >
                  Renter Demo
                </SecondaryButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;