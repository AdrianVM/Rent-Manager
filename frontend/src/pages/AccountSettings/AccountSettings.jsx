import React from 'react';
import { Link } from 'react-router-dom';
import './AccountSettings.css';

function AccountSettings({ user }) {
  return (
    <div className="account-settings">
      <div className="account-settings-header">
        <h1>Account Settings</h1>
        <p className="account-settings-subtitle">Manage your account preferences and settings</p>
      </div>

      <div className="account-settings-content">
        {/* Profile Section */}
        <section className="settings-section">
          <div className="settings-section-header">
            <h2>Profile Information</h2>
            <p>Manage your personal information and account details</p>
          </div>
          <div className="settings-card">
            <div className="settings-item">
              <div className="settings-item-info">
                <span className="settings-item-icon">👤</span>
                <div>
                  <h3>Name</h3>
                  <p>{user?.name || 'Not set'}</p>
                </div>
              </div>
              <button className="settings-btn-secondary">Edit</button>
            </div>
            <div className="settings-item">
              <div className="settings-item-info">
                <span className="settings-item-icon">📧</span>
                <div>
                  <h3>Email</h3>
                  <p>{user?.email || 'Not set'}</p>
                </div>
              </div>
              <button className="settings-btn-secondary">Edit</button>
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="settings-section">
          <div className="settings-section-header">
            <h2>Security</h2>
            <p>Manage your password and security preferences</p>
          </div>
          <div className="settings-card">
            <div className="settings-item">
              <div className="settings-item-info">
                <span className="settings-item-icon">🔒</span>
                <div>
                  <h3>Password</h3>
                  <p>Change your password</p>
                </div>
              </div>
              <button className="settings-btn-secondary">Change</button>
            </div>
            <div className="settings-item">
              <div className="settings-item-info">
                <span className="settings-item-icon">🔐</span>
                <div>
                  <h3>Two-Factor Authentication</h3>
                  <p>Add an extra layer of security</p>
                </div>
              </div>
              <button className="settings-btn-secondary">Enable</button>
            </div>
          </div>
        </section>

        {/* Privacy & Legal Section */}
        <section className="settings-section">
          <div className="settings-section-header">
            <h2>Privacy & Legal</h2>
            <p>Review policies and manage your data</p>
          </div>
          <div className="settings-card">
            <Link to="/privacy-policy" className="settings-link-item">
              <div className="settings-item-info">
                <span className="settings-item-icon">📋</span>
                <div>
                  <h3>Privacy Policy</h3>
                  <p>View our privacy policy and data handling practices</p>
                </div>
              </div>
              <span className="settings-arrow">›</span>
            </Link>
            <Link to="/cookie-policy" className="settings-link-item">
              <div className="settings-item-info">
                <span className="settings-item-icon">🍪</span>
                <div>
                  <h3>Cookie Policy</h3>
                  <p>Learn about our cookie usage</p>
                </div>
              </div>
              <span className="settings-arrow">›</span>
            </Link>
            <Link to="/data-requests" className="settings-link-item">
              <div className="settings-item-info">
                <span className="settings-item-icon">📂</span>
                <div>
                  <h3>Data Requests</h3>
                  <p>Request a copy of your data or account deletion</p>
                </div>
              </div>
              <span className="settings-arrow">›</span>
            </Link>
          </div>
        </section>

        {/* Preferences Section */}
        <section className="settings-section">
          <div className="settings-section-header">
            <h2>Preferences</h2>
            <p>Customize your experience</p>
          </div>
          <div className="settings-card">
            <div className="settings-item">
              <div className="settings-item-info">
                <span className="settings-item-icon">🔔</span>
                <div>
                  <h3>Notifications</h3>
                  <p>Manage email and push notifications</p>
                </div>
              </div>
              <button className="settings-btn-secondary">Configure</button>
            </div>
            <div className="settings-item">
              <div className="settings-item-info">
                <span className="settings-item-icon">🌍</span>
                <div>
                  <h3>Language & Region</h3>
                  <p>English (United States)</p>
                </div>
              </div>
              <button className="settings-btn-secondary">Change</button>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="settings-section danger-zone">
          <div className="settings-section-header">
            <h2>Danger Zone</h2>
            <p>Irreversible actions - proceed with caution</p>
          </div>
          <div className="settings-card">
            <div className="settings-item">
              <div className="settings-item-info">
                <span className="settings-item-icon">⚠️</span>
                <div>
                  <h3>Delete Account</h3>
                  <p>Permanently delete your account and all associated data</p>
                </div>
              </div>
              <button className="settings-btn-danger">Delete</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AccountSettings;
