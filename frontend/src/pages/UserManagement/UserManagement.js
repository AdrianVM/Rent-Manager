import React, { useState, useEffect } from 'react';
import './UserManagement.css';
import apiService from '../../services/api';
import { Table } from '../../components/common';

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
              <span className="form-label">Active</span>
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
      await apiService.createUser(formData);
      onUserCreated();
      onClose();
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
      const userData = await apiService.getUsers();
      setUsers(userData);
      setError(null);
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
      await apiService.deleteUser(userId);
      setUsers(users.filter(user => user.id !== userId));
    } catch (err) {
      alert('Error deleting user: ' + err.message);
    }
  };

  const handleUpdateUser = async (userId, updates) => {
    try {
      const updatedUser = await apiService.updateUser(userId, updates);
      setUsers(users.map(user => user.id === userId ? updatedUser : user));
      setEditingUser(null);
    } catch (err) {
      alert('Error updating user: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="user-management-loading">
        <h1>User Management</h1>
        <p>Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-management-error">
        <h1>User Management</h1>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={loadUsers}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="user-management-header">
        <h1>User Management</h1>
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

      <div className="card">
        <Table
          columns={[
            {
              header: 'Name',
              accessor: 'name'
            },
            {
              header: 'Email',
              accessor: 'email'
            },
            {
              header: 'Role',
              render: (user) => (
                <span className={`role-badge ${user.role?.toLowerCase()}`}>
                  {user.role}
                </span>
              )
            },
            {
              header: 'Status',
              render: (user) => (
                <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              )
            },
            {
              header: 'Last Login',
              render: (user) => user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'
            },
            {
              header: 'Actions',
              render: (user) => (
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
              )
            }
          ]}
          data={users}
          emptyMessage="No users found"
          renderMobileCard={(user) => (
            <>
              <div className="card-item-header">{user.name}</div>
              <div className="card-item-details">
                <div className="card-item-detail">
                  <span className="card-item-label">Email:</span>
                  <span className="card-item-value">{user.email}</span>
                </div>
                <div className="card-item-detail">
                  <span className="card-item-label">Role:</span>
                  <span className="card-item-value">
                    <span className={`role-badge ${user.role?.toLowerCase()}`}>
                      {user.role}
                    </span>
                  </span>
                </div>
                <div className="card-item-detail">
                  <span className="card-item-label">Status:</span>
                  <span className="card-item-value">
                    <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </span>
                </div>
                <div className="card-item-detail">
                  <span className="card-item-label">Last Login:</span>
                  <span className="card-item-value">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                  </span>
                </div>
              </div>
              <div className="card-item-actions">
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
            </>
          )}
        />
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
    </>
  );
}

export default UserManagement;
