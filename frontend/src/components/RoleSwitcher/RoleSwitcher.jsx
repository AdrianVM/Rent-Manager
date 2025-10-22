import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './RoleSwitcher.module.css';

function RoleSwitcher({ availableRoles, currentRole, onRoleChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Admin':
        return '👑';
      case 'PropertyOwner':
        return '🏢';
      case 'Renter':
        return '🏠';
      default:
        return '👤';
    }
  };

  const getRoleName = (role) => {
    switch (role) {
      case 'Admin':
        return 'Admin';
      case 'PropertyOwner':
        return 'Property Owner';
      case 'Renter':
        return 'Renter';
      default:
        return role;
    }
  };

  const getDashboardPath = (role) => {
    switch (role) {
      case 'Admin':
        return '/admin/dashboard';
      case 'PropertyOwner':
        return '/owner/dashboard';
      case 'Renter':
        return '/tenant/dashboard';
      default:
        return '/';
    }
  };

  const handleRoleSelect = (role) => {
    if (role !== currentRole) {
      onRoleChange(role);
      navigate(getDashboardPath(role));
    }
    setIsOpen(false);
  };

  if (!availableRoles || availableRoles.length <= 1) {
    return null;
  }

  return (
    <div className={styles.roleSwitcher} ref={dropdownRef}>
      <button
        className={styles.roleSwitcherTrigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className={styles.roleSwitcherIcon}>{getRoleIcon(currentRole)}</span>
        <span className={styles.roleSwitcherLabel}>{getRoleName(currentRole)}</span>
        <span className={`${styles.roleSwitcherArrow} ${isOpen ? styles.open : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className={styles.roleSwitcherDropdown}>
          <div className={styles.roleSwitcherHeader}>Switch Role</div>
          {availableRoles.map((role) => (
            <button
              key={role}
              className={`${styles.roleSwitcherOption} ${role === currentRole ? styles.active : ''}`}
              onClick={() => handleRoleSelect(role)}
            >
              <span className={styles.roleOptionIcon}>{getRoleIcon(role)}</span>
              <span className={styles.roleOptionLabel}>{getRoleName(role)}</span>
              {role === currentRole && (
                <span className={styles.roleOptionCheckmark}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default RoleSwitcher;
