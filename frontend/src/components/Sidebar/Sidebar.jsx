import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Sidebar.module.css';

function Sidebar({ user, currentRole }) {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const activeRole = currentRole || user?.role;
  const isAdmin = activeRole?.toLowerCase() === 'admin';
  const isPropertyOwner = activeRole?.toLowerCase() === 'propertyowner';
  const isRenter = activeRole?.toLowerCase() === 'renter';

  // Load saved sidebar state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      setIsCollapsed(JSON.parse(savedState));
    }
  }, []);

  // Update body attribute when sidebar collapse state changes
  useEffect(() => {
    if (isCollapsed) {
      document.body.setAttribute('data-sidebar-collapsed', 'true');
    } else {
      document.body.removeAttribute('data-sidebar-collapsed');
    }
  }, [isCollapsed]);

  // Save sidebar state to localStorage
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Navigation items configuration based on role
  const getNavItems = () => {
    if (isRenter) {
      return [
        { path: '/', label: 'Dashboard', icon: '📊', description: 'Overview' },
        { path: '/my-rental', label: 'My Rental', icon: '🏠', description: 'Property details' },
        { path: '/payment-history', label: 'Payments', icon: '💳', description: 'Payment history' },
        { path: '/maintenance', label: 'Maintenance', icon: '🔧', description: 'Service requests' },
        { path: '/documents', label: 'Documents', icon: '📄', description: 'Lease documents' },
        { path: '/settings', label: 'Settings', icon: '⚙️', description: 'Account settings' }
      ];
    } else if (isPropertyOwner) {
      return [
        { path: '/', label: 'Dashboard', icon: '📊', description: 'Overview' },
        { path: '/properties', label: 'Properties', icon: '🏢', description: 'Manage properties' },
        { path: '/tenants', label: 'Tenants', icon: '👥', description: 'Manage tenants' },
        { path: '/payments', label: 'Payments', icon: '💳', description: 'Track payments' },
        { path: '/reports', label: 'Reports', icon: '📈', description: 'Financial reports' },
        { path: '/maintenance', label: 'Maintenance', icon: '🔧', description: 'Service requests' },
        { path: '/settings', label: 'Settings', icon: '⚙️', description: 'Account settings' }
      ];
    } else if (isAdmin) {
      return [
        { path: '/', label: 'Dashboard', icon: '📊', description: 'Overview' },
        { path: '/properties', label: 'Properties', icon: '🏢', description: 'Manage properties' },
        { path: '/tenants', label: 'Tenants', icon: '👥', description: 'Manage tenants' },
        { path: '/payments', label: 'Payments', icon: '💳', description: 'Track payments' },
        { path: '/reports', label: 'Reports', icon: '📈', description: 'Analytics & reports' },
        { path: '/users', label: 'Users', icon: '👤', description: 'User management' },
        { path: '/system', label: 'System', icon: '🖥️', description: 'System settings' },
        { path: '/settings', label: 'Settings', icon: '⚙️', description: 'Account settings' }
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

  return (
    <>
      {/* Desktop/Tablet Sidebar */}
      <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
        {/* Collapse Toggle Button */}
        <button
          className={styles.collapseToggle}
          onClick={toggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className={styles.toggleIcon}>
            {isCollapsed ? '»' : '«'}
          </span>
        </button>

        {/* Navigation Items */}
        <nav className={styles.sidebarNav}>
          <ul className={styles.navList}>
            {navItems.map((item) => (
              <li key={item.path} className={styles.navItem}>
                <Link
                  to={item.path}
                  className={`${styles.navLink} ${isActive(item.path) ? styles.active : ''}`}
                  title={isCollapsed ? item.label : ''}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  {!isCollapsed && (
                    <span className={styles.navContent}>
                      <span className={styles.navLabel}>{item.label}</span>
                      <span className={styles.navDescription}>{item.description}</span>
                    </span>
                  )}
                  {isActive(item.path) && (
                    <span className={styles.activeIndicator}></span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        {!isCollapsed && (
          <div className={styles.sidebarFooter}>
            <div className={styles.roleInfo}>
              <span className={styles.roleLabel}>Current Role</span>
              <span className={styles.roleName}>{activeRole}</span>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Sidebar Toggle Button */}
      <button
        className={styles.mobileToggle}
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle menu"
        aria-expanded={isMobileOpen}
      >
        <span className={styles.hamburgerLine}></span>
        <span className={styles.hamburgerLine}></span>
        <span className={styles.hamburgerLine}></span>
      </button>

      {/* Mobile Sidebar */}
      <aside className={`${styles.mobileSidebar} ${isMobileOpen ? styles.open : ''}`}>
        {/* Mobile Header */}
        <div className={styles.mobileHeader}>
          <div className={styles.mobileLogo}>
            <span className={styles.logoIcon}>AVM</span>
            <span className={styles.logoText}>Property Management</span>
          </div>
          <button
            className={styles.mobileClose}
            onClick={() => setIsMobileOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav className={styles.mobileNav}>
          <ul className={styles.mobileNavList}>
            {navItems.map((item) => (
              <li key={item.path} className={styles.mobileNavItem}>
                <Link
                  to={item.path}
                  className={`${styles.mobileNavLink} ${isActive(item.path) ? styles.active : ''}`}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <span className={styles.mobileNavIcon}>{item.icon}</span>
                  <span className={styles.mobileNavContent}>
                    <span className={styles.mobileNavLabel}>{item.label}</span>
                    <span className={styles.mobileNavDescription}>{item.description}</span>
                  </span>
                  <span className={styles.mobileNavArrow}>›</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Mobile Footer */}
        <div className={styles.mobileFooter}>
          <div className={styles.mobileRoleInfo}>
            <span className={styles.mobileRoleLabel}>Current Role</span>
            <span className={styles.mobileRoleName}>{activeRole}</span>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className={styles.mobileBackdrop}
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}

export default Sidebar;
