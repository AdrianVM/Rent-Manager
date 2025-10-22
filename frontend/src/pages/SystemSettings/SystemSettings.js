import React, { useState } from 'react';
import DemoDataSeeder from '../../components/common/DemoDataSeeder';
import './SystemSettings.css';

function SystemSettings() {
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  return (
    <>
      <div className="system-settings-header">
        <h1>System Settings</h1>
      </div>

      <div className="settings-container">
        <div className="settings-section">
          <div className="card">
            <h2 className="settings-section-title">Database Management</h2>
            <p className="settings-section-description">
              Load sample data for testing and demonstration purposes.
            </p>
            <DemoDataSeeder
              disabled={showSuccessModal}
              onDataSeeded={(success) => {
                if (success !== false) {
                  setShowSuccessModal(true);
                }
              }}
            />
          </div>
        </div>
      </div>

      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="success-modal-content">
              <div className="success-icon">
                ✅
              </div>
              <h3 className="success-title">
                Demo Data Loaded Successfully!
              </h3>
              <p className="success-message">
                Sample properties, tenants, and payment records have been created. You can now explore all the features of the Rent Manager application.
              </p>
              <button
                className="btn-modern"
                onClick={() => setShowSuccessModal(false)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SystemSettings;
