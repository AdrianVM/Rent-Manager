import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import RoleSwitcher from '../RoleSwitcher/RoleSwitcher';
import styles from './Navigation.module.css';

function Navigation({ user, availableRoles, currentRole, onRoleChange, onLogout }) {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const activeRole = currentRole || user?.role;

  return (
    <nav className={styles.appleNav}>
      <div className={styles.appleNavContainer}>
        {/* Brand Section */}
        <div className={styles.appleNavBrand}>
          <Link to="/" className={styles.appleBrandLink}>
            <div className={styles.appleBrandIcon}>AVM</div>
            <div className={styles.appleBrandText}>Property Management</div>
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

      {/* Mobile Navigation Menu */}
      <div className={`${styles.appleNavMobile} ${mobileMenuOpen ? styles.open : ''}`}>
        <div className={styles.appleMobileContent}>
          {/* User Info on Mobile */}
          <div className={styles.appleMobileUser}>
            <div className={`${styles.appleUserAvatar} ${styles.large}`}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className={styles.appleMobileUserName}>{user?.name}</div>
            <div className={styles.appleMobileUserRole}>{activeRole}</div>
          </div>

          {/* Mobile Actions */}
          <div className={styles.appleMobileActions}>
            {/* Role Switcher on Mobile */}
            {availableRoles && availableRoles.length > 1 && (
              <div className={styles.appleMobileAction}>
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
    </nav>
  );
}

export default Navigation;
