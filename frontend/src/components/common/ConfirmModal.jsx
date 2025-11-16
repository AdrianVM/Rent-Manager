import React from 'react';
import './ConfirmModal.css';

/**
 * Reusable confirmation modal matching the app's theme
 */
function ConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonStyle = 'primary', // 'primary', 'danger', 'success'
  children
}) {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div className="confirm-modal-overlay" onClick={handleBackdropClick}>
      <div className="confirm-modal">
        <div className="confirm-modal-header">
          <h2>{title}</h2>
        </div>

        <div className="confirm-modal-content">
          {message && <p>{message}</p>}
          {children}
        </div>

        <div className="confirm-modal-footer">
          <button
            className="btn-modal btn-cancel"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            className={`btn-modal btn-confirm btn-${confirmButtonStyle}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
