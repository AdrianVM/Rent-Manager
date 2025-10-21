import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear any remaining session data
    sessionStorage.clear();

    // Redirect to login after a short delay
    const timer = setTimeout(() => {
      navigate('/login', { replace: true });
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-secondary)'
    }}>
      <div className="card" style={{ textAlign: 'center', maxWidth: '400px' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>👋</div>
        <h2 style={{ color: 'var(--primary-color)', marginBottom: '15px' }}>
          Logged Out Successfully
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
          You have been logged out of your account.
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Redirecting to login...
        </p>
      </div>
    </div>
  );
}

export default Logout;
