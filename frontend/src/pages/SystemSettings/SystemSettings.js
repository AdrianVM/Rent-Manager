import React, { useState } from 'react';
import DemoDataSeeder from '../../components/common/DemoDataSeeder';
import EmailSender from '../../components/admin/EmailSender';
import './SystemSettings.css';

function SystemSettings() {
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [activeTab, setActiveTab] = useState('email');

  return (
    <>
      <div className="system-settings-header">
        <h1>System Settings</h1>
      </div>

      <div className="settings-container">
        {/* Tab Navigation */}
        <div className="tabs-container">
          <button
            className={`tab-button ${activeTab === 'email' ? 'active' : ''}`}
            onClick={() => setActiveTab('email')}
          >
            <span className="tab-icon">📧</span>
            Email Management
          </button>
          <button
            className={`tab-button ${activeTab === 'database' ? 'active' : ''}`}
            onClick={() => setActiveTab('database')}
          >
            <span className="tab-icon">🗄️</span>
            Database Management
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'email' && (
            <div className="settings-section">
              <div className="card">
                <h2 className="settings-section-title">Email Management</h2>
                <p className="settings-section-description">
                  Send emails to users and test email configuration.
                </p>
                <EmailSender />
              </div>
            </div>
          )}

          {activeTab === 'database' && (
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
          )}
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
