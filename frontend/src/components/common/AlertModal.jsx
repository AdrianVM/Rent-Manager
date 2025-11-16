import React from 'react';
import './AlertModal.css';

/**
 * Reusable alert modal matching the app's theme
 */
function AlertModal({
  isOpen,
  onClose,
  title,
  message,
  type = 'info', // 'info', 'success', 'warning', 'error'
  buttonText = 'OK',
  children
}) {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className="alert-modal-overlay" onClick={handleBackdropClick}>
      <div className={`alert-modal alert-modal-${type}`}>
        <div className="alert-modal-header">
          <div className="alert-icon">{getIcon()}</div>
          <h2>{title}</h2>
        </div>

        <div className="alert-modal-content">
          {message && <p>{message}</p>}
          {children}
        </div>

        <div className="alert-modal-footer">
          <button
            className={`btn-alert btn-alert-${type}`}
            onClick={onClose}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AlertModal;
