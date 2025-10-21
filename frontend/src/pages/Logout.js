import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Logout.css';

function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear any remaining session data
    sessionStorage.clear();

    // Redirect to login after a short delay
    const timer = setTimeout(() => {
      navigate('/login', { replace: true });
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="logout-container">
      {/* Animated Background Orbs */}
      <div className="logout-background-orb logout-orb-1"></div>
      <div className="logout-background-orb logout-orb-2"></div>
      <div className="logout-background-orb logout-orb-3"></div>

      {/* Main Card */}
      <div className="logout-card">
        {/* Success Checkmark */}
        <div className="logout-checkmark-container">
          <span className="logout-checkmark">✓</span>
        </div>

        {/* Title */}
        <h1 className="logout-title">Successfully Logged Out</h1>

        {/* Message */}
        <p className="logout-message">
          Your session has been securely terminated. Thank you for using Rent Manager.
        </p>

        {/* Security Badge */}
        <div className="logout-security-badge">
          <span className="logout-security-icon">🔒</span>
          <span>Session data cleared</span>
        </div>

        {/* Redirect Notice */}
        <div className="logout-redirect-text">
          <div className="logout-spinner"></div>
          <span>Redirecting to login page...</span>
        </div>
      </div>
    </div>
  );
}

export default Logout;
