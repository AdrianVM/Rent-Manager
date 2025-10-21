import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './RoleSwitcher.css';

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
    <div className="role-switcher" ref={dropdownRef}>
      <button
        className="role-switcher-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="role-switcher-icon">{getRoleIcon(currentRole)}</span>
        <span className="role-switcher-label">{getRoleName(currentRole)}</span>
        <span className={`role-switcher-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="role-switcher-dropdown">
          <div className="role-switcher-header">Switch Role</div>
          {availableRoles.map((role) => (
            <button
              key={role}
              className={`role-switcher-option ${role === currentRole ? 'active' : ''}`}
              onClick={() => handleRoleSelect(role)}
            >
              <span className="role-option-icon">{getRoleIcon(role)}</span>
              <span className="role-option-label">{getRoleName(role)}</span>
              {role === currentRole && (
                <span className="role-option-checkmark">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default RoleSwitcher;
