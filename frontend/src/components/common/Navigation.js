import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import RoleSwitcher from './RoleSwitcher';
import './Navigation.css';

function Navigation({ user, availableRoles, currentRole, onRoleChange, onLogout }) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const activeRole = currentRole || user?.role;
  const canAccessPropertyOwnerFeatures = activeRole?.toLowerCase() === 'admin' || activeRole?.toLowerCase() === 'propertyowner';

  // Navigation items configuration
  const navItems = [
    { path: '/', label: 'Dashboard', icon: '■', show: true },
    { path: '/properties', label: 'Properties', icon: '⌂', show: canAccessPropertyOwnerFeatures },
    { path: '/tenants', label: 'Tenants', icon: '👥', show: canAccessPropertyOwnerFeatures },
    { path: '/payments', label: 'Payments', icon: '💳', show: canAccessPropertyOwnerFeatures }
  ];

  return (
    <nav className="apple-nav">
      <div className="apple-nav-container">
        {/* Brand Section */}
        <div className="apple-nav-brand">
          <Link to="/" className="apple-brand-link">
            <div className="apple-brand-icon">AVM</div>
            <div className="apple-brand-text">Property Management</div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="apple-nav-desktop">
          {/* Main Navigation Links */}
          <div className="apple-nav-links">
            {navItems.filter(item => item.show).map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`apple-nav-link ${location.pathname === item.path ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="apple-nav-actions">
            {/* Role Switcher */}
            {availableRoles && availableRoles.length > 1 && (
              <div className="apple-nav-action">
                <RoleSwitcher
                  availableRoles={availableRoles}
                  currentRole={activeRole}
                  onRoleChange={onRoleChange}
                />
              </div>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="apple-nav-icon-btn"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              <span className="apple-icon">{theme === 'light' ? '🌙' : '☀️'}</span>
            </button>

            {/* User Menu */}
            <div className="apple-nav-user">
              <div className="apple-user-avatar">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="apple-user-info">
                <div className="apple-user-name">{user?.name}</div>
                <button onClick={onLogout} className="apple-logout-btn">
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className={`apple-mobile-toggle ${mobileMenuOpen ? 'open' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      <div className={`apple-nav-mobile ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="apple-mobile-content">
          {/* User Info on Mobile */}
          <div className="apple-mobile-user">
            <div className="apple-user-avatar large">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="apple-mobile-user-name">{user?.name}</div>
            <div className="apple-mobile-user-role">{activeRole}</div>
          </div>

          {/* Mobile Navigation Links */}
          <div className="apple-mobile-links">
            {navItems.filter(item => item.show).map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`apple-mobile-link ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="mobile-link-icon">{item.icon}</span>
                <span className="mobile-link-text">{item.label}</span>
                <span className="mobile-link-arrow">›</span>
              </Link>
            ))}
          </div>

          {/* Mobile Actions */}
          <div className="apple-mobile-actions">
            {/* Role Switcher on Mobile */}
            {availableRoles && availableRoles.length > 1 && (
              <div className="apple-mobile-action">
                <RoleSwitcher
                  availableRoles={availableRoles}
                  currentRole={activeRole}
                  onRoleChange={(role) => {
                    onRoleChange(role);
                    setMobileMenuOpen(false);
                  }}
                />
              </div>
            )}

            {/* Theme Toggle on Mobile */}
            <button
              onClick={toggleTheme}
              className="apple-mobile-btn"
            >
              <span className="apple-icon">{theme === 'light' ? '🌙' : '☀️'}</span>
              <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
            </button>

            {/* Logout on Mobile */}
            <button
              onClick={() => {
                onLogout();
                setMobileMenuOpen(false);
              }}
              className="apple-mobile-btn logout"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          className="apple-mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </nav>
  );
}

export default Navigation;
