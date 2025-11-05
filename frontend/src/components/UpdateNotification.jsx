import React, { useState } from 'react';
import './UpdateNotification.css';

const UpdateNotification = ({ registration, onDismiss }) => {
  const [show, setShow] = useState(true);

  const handleUpdate = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setShow(false);
    if (onDismiss) onDismiss();
  };

  if (!show) return null;

  return (
    <div className="update-notification">
      <div className="update-notification-content">
        <div className="update-notification-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"
              fill="currentColor"
              opacity="0.3"
            />
            <path
              d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18.5c-4.5-1.08-7-5.5-7-10.5V8l7-3.5 7 3.5v2c0 5-2.5 9.42-7 10.5z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div className="update-notification-text">
          <strong>New version available!</strong>
          <p>Update now to get the latest features and improvements.</p>
        </div>
        <div className="update-notification-actions">
          <button
            className="update-btn-dismiss"
            onClick={handleDismiss}
            aria-label="Dismiss update notification"
          >
            Later
          </button>
          <button
            className="update-btn-update"
            onClick={handleUpdate}
            aria-label="Update now"
          >
            Update Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification;
