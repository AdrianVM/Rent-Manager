import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import RoleSwitcher from './RoleSwitcher';

function Navigation({ user, availableRoles, currentRole, onRoleChange, onLogout }) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const activeRole = currentRole || user?.role;
  const canAccessPropertyOwnerFeatures = activeRole?.toLowerCase() === 'admin' || activeRole?.toLowerCase() === 'propertyowner';

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
              {availableRoles && availableRoles.length > 1 && (
                <li>
                  <RoleSwitcher
                    availableRoles={availableRoles}
                    currentRole={activeRole}
                    onRoleChange={onRoleChange}
                  />
                </li>
              )}
              <li className="nav-user-info">
                <span className="nav-user-name">
                  {user?.name}
                </span>
                <button
                  onClick={onLogout}
                  className="btn-secondary nav-logout-btn"
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
                <div className="nav-user-info-mobile">
                  {user?.name}
                </div>
              </li>
              {availableRoles && availableRoles.length > 1 && (
                <li>
                  <RoleSwitcher
                    availableRoles={availableRoles}
                    currentRole={activeRole}
                    onRoleChange={(role) => {
                      onRoleChange(role);
                      setMobileMenuOpen(false);
                    }}
                  />
                </li>
              )}
              <li>
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="theme-toggle-mobile nav-logout-btn-mobile"
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
