import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import DemoDataSeeder from '../components/common/DemoDataSeeder';

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

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: '#dc3545',
      propertyowner: '#0d6efd',
      renter: '#198754'
    };
    return colors[role?.toLowerCase()] || '#6c757d';
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
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>User Management</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateUser(true)}
        >
          Create User
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-color)' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Name</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Email</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Role</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Last Login</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px' }}>{user.name}</td>
                <td style={{ padding: '12px' }}>{user.email}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    backgroundColor: getRoleBadgeColor(user.role),
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    textTransform: 'capitalize'
                  }}>
                    {user.role}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    color: user.isActive ? '#198754' : '#dc3545',
                    fontWeight: 'bold'
                  }}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-sm"
                      style={{ backgroundColor: '#0d6efd', color: 'white', fontSize: '12px', padding: '4px 8px' }}
                      onClick={() => setEditingUser(user)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{ backgroundColor: '#dc3545', color: 'white', fontSize: '12px', padding: '4px 8px' }}
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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        padding: '30px',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '500px',
        border: '1px solid var(--border-color)'
      }}>
        <h3 style={{ marginBottom: '20px' }}>Edit User</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-control"
              style={{ width: '100%' }}
              required
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="form-control"
              style={{ width: '100%' }}
              required
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="form-control"
              style={{ width: '100%' }}
            >
              <option value="renter">Renter</option>
              <option value="propertyowner">Property Owner</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              Active
            </label>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        padding: '30px',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '500px',
        border: '1px solid var(--border-color)'
      }}>
        <h3 style={{ marginBottom: '20px' }}>Create New User</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-control"
              style={{ width: '100%' }}
              required
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="form-control"
              style={{ width: '100%' }}
              required
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="form-control"
              style={{ width: '100%' }}
              required
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="form-control"
              style={{ width: '100%' }}
            >
              <option value="renter">Renter</option>
              <option value="propertyowner">Property Owner</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
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

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await apiService.getDashboardStats();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.');
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
        <h1>Admin Dashboard</h1>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#dc3545' }}>
        <h1>Admin Dashboard</h1>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={loadDashboardData}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ color: 'var(--primary-color)', marginBottom: '10px' }}>
          Admin Dashboard
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          System administration and user management
        </p>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <nav style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', gap: '20px' }}>
            <button
              onClick={() => setActiveTab('overview')}
              style={{
                background: 'none',
                border: 'none',
                padding: '12px 0',
                borderBottom: activeTab === 'overview' ? '2px solid var(--primary-color)' : '2px solid transparent',
                color: activeTab === 'overview' ? 'var(--primary-color)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              style={{
                background: 'none',
                border: 'none',
                padding: '12px 0',
                borderBottom: activeTab === 'users' ? '2px solid var(--primary-color)' : '2px solid transparent',
                color: activeTab === 'users' ? 'var(--primary-color)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              User Management
            </button>
            <button
              onClick={() => setActiveTab('system')}
              style={{
                background: 'none',
                border: 'none',
                padding: '12px 0',
                borderBottom: activeTab === 'system' ? '2px solid var(--primary-color)' : '2px solid transparent',
                color: activeTab === 'system' ? 'var(--primary-color)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              System Settings
            </button>
          </div>
        </nav>
      </div>

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
        <div style={{ padding: '20px' }}>
          <h2>System Settings</h2>
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            <h3>Database Management</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Load sample data for testing and demonstration purposes. This feature is available only in the System Settings section of the Admin Dashboard.
            </p>
            <DemoDataSeeder
              disabled={showSuccessModal}
              onDataSeeded={(success) => {
                if (success !== false) {
                  setShowSuccessModal(true);
                }
                loadDashboardData();
              }}
            />
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            padding: '30px',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '500px',
            border: '1px solid var(--border-color)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '20px'
            }}>
              ✅
            </div>
            <h3 style={{
              color: '#198754',
              marginBottom: '15px',
              fontWeight: 'bold'
            }}>
              Demo Data Loaded Successfully!
            </h3>
            <p style={{
              color: 'var(--text-primary)',
              marginBottom: '25px',
              fontSize: '16px'
            }}>
              Sample properties, tenants, and payment records have been created. You can now explore all the features of the Rent Manager application.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => setShowSuccessModal(false)}
              style={{
                fontSize: '16px',
                padding: '10px 30px'
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;