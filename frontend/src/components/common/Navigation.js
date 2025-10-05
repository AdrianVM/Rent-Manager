import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

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

export default Navigation;
