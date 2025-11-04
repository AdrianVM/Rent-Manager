import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import RoleSwitcher from '../RoleSwitcher/RoleSwitcher';
import Logo from '../Logo';
import styles from './Navigation.module.css';

function Navigation({ user, availableRoles, currentRole, onRoleChange, onLogout }) {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const location = useLocation();

  const activeRole = currentRole || user?.role;
  const isRenter = activeRole?.toLowerCase() === 'renter';
  const isAdmin = activeRole?.toLowerCase() === 'admin';
  const isPropertyOwner = activeRole?.toLowerCase() === 'propertyowner';

  // Navigation items configuration based on role (from Sidebar)
  const getNavItems = () => {
    if (isRenter) {
      return [
        { path: '/', label: 'Dashboard', icon: '📊', description: 'Overview' },
        { path: '/my-rental', label: 'My Rental', icon: '🏠', description: 'Property details' },
        { path: '/payment-history', label: 'Payments', icon: '💳', description: 'Payment history' },
        { path: '/maintenance', label: 'Maintenance', icon: '🔧', description: 'Service requests' },
        { path: '/documents', label: 'Documents', icon: '📄', description: 'Lease documents' }
      ];
    } else if (isPropertyOwner) {
      return [
        { path: '/', label: 'Dashboard', icon: '📊', description: 'Overview' },
        { path: '/properties', label: 'Properties', icon: '🏢', description: 'Manage properties' },
        { path: '/tenants', label: 'Tenants', icon: '👥', description: 'Manage tenants' },
        { path: '/payments', label: 'Payments', icon: '💳', description: 'Track payments' },
        { path: '/reports', label: 'Reports', icon: '📈', description: 'Financial reports' },
        { path: '/maintenance', label: 'Maintenance', icon: '🔧', description: 'Service requests' }
      ];
    } else if (isAdmin) {
      return [
        { path: '/', label: 'Dashboard', icon: '📊', description: 'Overview' },
        { path: '/properties', label: 'Properties', icon: '🏢', description: 'Manage properties' },
        { path: '/tenants', label: 'Tenants', icon: '👥', description: 'Manage tenants' },
        { path: '/payments', label: 'Payments', icon: '💳', description: 'Track payments' },
        { path: '/reports', label: 'Reports', icon: '📈', description: 'Analytics & reports' },
        { path: '/user-management', label: 'Users', icon: '👤', description: 'User management' },
        { path: '/system-settings', label: 'System', icon: '🖥️', description: 'System settings' }
      ];
    }
    return [];
  };

  const navItems = getNavItems();

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Close menu on route change
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
    <nav className={styles.appleNav}>
      <div className={styles.appleNavContainer}>
        {/* Brand Section */}
        <div className={styles.appleNavBrand}>
          <Link to="/" className={styles.appleBrandLink}>
            <Logo size="medium" showText={true} showSubtext={true} />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className={styles.appleNavDesktop}>
          {/* Right Side Actions */}
          <div className={styles.appleNavActions}>
            {/* Role Switcher */}
            {availableRoles && availableRoles.length > 1 && (
              <div className={styles.appleNavAction}>
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
              className={styles.appleNavIconBtn}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              <span className={styles.appleIcon}>{theme === 'light' ? '🌙' : '☀️'}</span>
            </button>

            {/* User Menu */}
            <div className={styles.appleNavUser}>
              <div className={styles.appleUserAvatar}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className={styles.appleUserInfo}>
                <div className={styles.appleUserName}>{user?.name}</div>
                <Link to="/settings" className={styles.appleSettingsLink}>
                  Account Settings
                </Link>
                <button onClick={onLogout} className={styles.appleLogoutBtn}>
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className={`${styles.appleMobileToggle} ${mobileMenuOpen ? styles.open : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
        </button>
      </div>

      </nav>

      {/* Mobile Navigation Menu - Outside nav to avoid stacking context issues */}
      <div
        className={`${styles.appleNavMobile} ${mobileMenuOpen ? styles.open : ''}`}
        style={mobileMenuOpen ? {
          display: 'block',
          transform: 'translateX(0)',
          zIndex: 1100
        } : {}}
      >
        <div className={styles.appleMobileContent}>
          {/* Section 1: User Identity */}
          <div className={styles.appleMobileUser}>
            <div className={`${styles.appleUserAvatar} ${styles.large}`}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className={styles.appleMobileUserName}>{user?.name}</div>
            <div className={styles.appleMobileUserRole}>{activeRole}</div>
          </div>

          {/* Section 2: Primary Navigation */}
          <div className={styles.appleMobileNavLinks}>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`${styles.appleMobileNavLink} ${isActive(item.path) ? styles.active : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className={styles.mobileNavIcon}>{item.icon}</span>
                <span className={styles.mobileNavContent}>
                  <span className={styles.mobileNavLabel}>{item.label}</span>
                  <span className={styles.mobileNavDescription}>{item.description}</span>
                </span>
                {isActive(item.path) && (
                  <span className={styles.mobileNavArrow}>›</span>
                )}
              </Link>
            ))}
          </div>

          {/* Section 3: Settings & Preferences */}
          <div className={styles.appleMobileActions}>
            {/* Role Switcher on Mobile */}
            {availableRoles && availableRoles.length > 1 && (
              <div
                className={styles.appleMobileAction}
                style={{
                  '--show-role-label': 'block'
                }}
              >
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
              className={styles.appleMobileBtn}
            >
              <span className={styles.appleIcon}>{theme === 'light' ? '🌙' : '☀️'}</span>
              <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
            </button>

            {/* Account Settings on Mobile */}
            <Link
              to="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className={styles.appleMobileBtn}
            >
              <span className={styles.appleIcon}>⚙️</span>
              <span>Account Settings</span>
            </Link>

            {/* Logout on Mobile */}
            <button
              onClick={() => {
                onLogout();
                setMobileMenuOpen(false);
              }}
              className={`${styles.appleMobileBtn} ${styles.logout}`}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          className={styles.appleMobileBackdrop}
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}

export default Navigation;
