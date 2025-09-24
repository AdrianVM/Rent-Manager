import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useTheme } from './contexts/ThemeContext';
import authService from './services/authService';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import RenterDashboard from './components/RenterDashboard';
import Properties from './components/Properties';
import Tenants from './components/Tenants';
import Payments from './components/Payments';

function Navigation({ user, onLogout }) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const canAccessPropertyOwnerFeatures = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'propertyowner';

  return (
    <nav className="nav">
      <div className="container">
        <div className="nav-header">
          <Link to="/" className="nav-brand">
            <span className="brand-logo">AVM</span>
            <span className="brand-text">Property Management</span>
          </Link>
          <div className="nav-desktop">
            <ul className="nav-links">
              <li><Link to="/" className={location.pathname === '/' ? 'active' : ''}>Dashboard</Link></li>
              {canAccessPropertyOwnerFeatures && (
                <>
                  <li><Link to="/properties" className={location.pathname === '/properties' ? 'active' : ''}>Properties</Link></li>
                  <li><Link to="/tenants" className={location.pathname === '/tenants' ? 'active' : ''}>Tenants</Link></li>
                  <li><Link to="/payments" className={location.pathname === '/payments' ? 'active' : ''}>Payments</Link></li>
                </>
              )}
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {user?.name} ({user?.role})
                </span>
                <button 
                  onClick={onLogout}
                  className="btn-secondary"
                  style={{ 
                    padding: '6px 12px', 
                    fontSize: '12px', 
                    borderRadius: '6px'
                  }}
                >
                  Logout
                </button>
              </li>
              <li>
                <button onClick={toggleTheme} className="theme-toggle" title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
                  <span className="theme-icon">{theme === 'light' ? '🌙' : '☀️'}</span>
                  <span className="theme-text">{theme === 'light' ? 'Dark' : 'Light'}</span>
                </button>
              </li>
            </ul>
          </div>
          <button 
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="nav-mobile">
            <ul className="nav-links-mobile">
              <li><Link to="/" className={location.pathname === '/' ? 'active' : ''} onClick={() => setMobileMenuOpen(false)}>Dashboard</Link></li>
              {canAccessPropertyOwnerFeatures && (
                <>
                  <li><Link to="/properties" className={location.pathname === '/properties' ? 'active' : ''} onClick={() => setMobileMenuOpen(false)}>Properties</Link></li>
                  <li><Link to="/tenants" className={location.pathname === '/tenants' ? 'active' : ''} onClick={() => setMobileMenuOpen(false)}>Tenants</Link></li>
                  <li><Link to="/payments" className={location.pathname === '/payments' ? 'active' : ''} onClick={() => setMobileMenuOpen(false)}>Payments</Link></li>
                </>
              )}
              <li>
                <div style={{ padding: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {user?.name} ({user?.role})
                </div>
              </li>
              <li>
                <button 
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="theme-toggle-mobile"
                  style={{ backgroundColor: 'var(--secondary-color)', marginBottom: '10px' }}
                >
                  Logout
                </button>
              </li>
              <li>
                <button onClick={toggleTheme} className="theme-toggle-mobile">
                  <span className="theme-icon">{theme === 'light' ? '🌙' : '☀️'}</span>
                  {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated on app load
    if (authService.isAuthenticated()) {
      setUser(authService.getCurrentUser());
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: 'var(--bg-color)'
      }}>
        <div style={{ color: 'var(--text-primary)' }}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const isRenter = user?.role?.toLowerCase() === 'renter';
  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const canAccessPropertyOwnerFeatures = isAdmin || user?.role?.toLowerCase() === 'propertyowner';


  return (
    <Router>
      <div className="App">
        <Navigation user={user} onLogout={handleLogout} />
        <div className="container">
          <Routes>
            <Route
              path="/"
              element={
                isRenter ? <RenterDashboard /> :
                isAdmin ? <AdminDashboard /> :
                <Dashboard />
              }
            />
            {canAccessPropertyOwnerFeatures && (
              <>
                <Route path="/properties" element={<Properties />} />
                <Route path="/tenants" element={<Tenants />} />
                <Route path="/payments" element={<Payments />} />
              </>
            )}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;