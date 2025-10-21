import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import DemoDataSeeder from '../components/common/DemoDataSeeder';
import './AdminDashboard.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5057/api';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [showCreateUser, setShowCreateUser] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/auth/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const userData = await response.json();
        setUsers(userData);
      } else {
        setError('Failed to load users');
      }
    } catch (err) {
      setError('Error loading users: ' + err.message);
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        setUsers(users.filter(user => user.id !== userId));
      } else {
        alert('Failed to delete user');
      }
    } catch (err) {
      alert('Error deleting user: ' + err.message);
    }
  };

  const handleUpdateUser = async (userId, updates) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(users.map(user => user.id === userId ? updatedUser : user));
        setEditingUser(null);
      } else {
        alert('Failed to update user');
      }
    } catch (err) {
      alert('Error updating user: ' + err.message);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading users...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: '#dc3545' }}>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={loadUsers}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="user-management-container">
      <div className="user-management-header">
        <h2>User Management</h2>
        <button
          className="btn-modern"
          onClick={() => setShowCreateUser(true)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Create User
        </button>
      </div>

      <div className="table-container">
        <table className="modern-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge ${user.role?.toLowerCase()}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-modern btn-modern-secondary btn-modern-small"
                      onClick={() => setEditingUser(user)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-modern btn-modern-danger btn-modern-small"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onSave={handleUpdateUser}
          onClose={() => setEditingUser(null)}
        />
      )}

      {showCreateUser && (
        <CreateUserModal
          onClose={() => setShowCreateUser(false)}
          onUserCreated={loadUsers}
        />
      )}
    </div>
  );
}

function EditUserModal({ user, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    role: user.role || 'renter',
    isActive: user.isActive !== undefined ? user.isActive : true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(user.id, formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>Edit User</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="form-select"
            >
              <option value="renter">Renter</option>
              <option value="propertyowner">Property Owner</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-checkbox-container">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="form-checkbox"
              />
              <span className="form-label" style={{ marginBottom: 0 }}>Active</span>
            </label>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-modern btn-modern-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-modern">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateUserModal({ onClose, onUserCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'renter'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onUserCreated();
        onClose();
      } else {
        alert('Failed to create user');
      }
    } catch (err) {
      alert('Error creating user: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>Create New User</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="form-select"
            >
              <option value="renter">Renter</option>
              <option value="propertyowner">Property Owner</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-modern btn-modern-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-modern" disabled={loading}>
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async (showLoadingState = true) => {
    try {
      if (showLoadingState) {
        setLoading(true);
      }
      const data = await apiService.getDashboardStats();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.');
      console.error('Error loading dashboard data:', err);
    } finally {
      if (showLoadingState) {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard-container">
        <div className="loading-container">
          <h1>Admin Dashboard</h1>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard-container">
        <div className="error-container">
          <h1>Admin Dashboard</h1>
          <p>{error}</p>
          <button className="btn-modern" onClick={() => loadDashboardData(false)}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      <div className="admin-header">
        <div className="admin-header-content">
          <h1 className="admin-title">
            Admin Dashboard
          </h1>
          <p className="admin-subtitle">
            System administration and user management
          </p>
        </div>
      </div>

      <div className="admin-tabs">
        <nav className="admin-tabs-container">
          <button
            onClick={() => setActiveTab('overview')}
            className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          >
            User Management
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`admin-tab ${activeTab === 'system' ? 'active' : ''}`}
          >
            System Settings
          </button>
        </nav>
      </div>

      <div className="admin-content">
        {activeTab === 'overview' && (
          <div>
            {dashboardData && (
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Total Properties</h3>
                  <div className="stat-number">{dashboardData.totalProperties}</div>
                  <div className="stat-change positive">System-wide</div>
                </div>
                <div className="stat-card">
                  <h3>Total Tenants</h3>
                  <div className="stat-number">{dashboardData.totalTenants}</div>
                  <div className="stat-change positive">All active</div>
                </div>
                <div className="stat-card">
                  <h3>Monthly Revenue</h3>
                  <div className="stat-number">${dashboardData.monthlyRevenue?.toLocaleString()}</div>
                  <div className="stat-change positive">Current month</div>
                </div>
                <div className="stat-card">
                  <h3>Occupancy Rate</h3>
                  <div className="stat-number">{dashboardData.occupancyRate}%</div>
                  <div className="stat-change positive">Overall system</div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && <UserManagement />}

        {activeTab === 'system' && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px', letterSpacing: '-0.02em' }}>System Settings</h2>
            <div className="settings-section">
              <h3>Database Management</h3>
              <p>
                Load sample data for testing and demonstration purposes. This feature is available only in the System Settings section of the Admin Dashboard.
              </p>
              <DemoDataSeeder
                disabled={showSuccessModal}
                onDataSeeded={(success) => {
                  if (success !== false) {
                    setShowSuccessModal(true);
                  }
                  loadDashboardData(false);
                }}
              />
            </div>
          </div>
        )}
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
    </div>
  );
}

export default AdminDashboard;