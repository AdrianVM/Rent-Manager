import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import InviteTenantModal from '../components/common/InviteTenantModal';
import { PrimaryButton, SecondaryButton, DangerButton } from '../components/common';

function TenantForm({ tenant, onSave, onCancel, properties }) {
  const [formData, setFormData] = useState({
    name: tenant?.name || '',
    email: tenant?.email || '',
    phone: tenant?.phone || '',
    propertyId: tenant?.propertyId || '',
    leaseStart: tenant?.leaseStart || '',
    leaseEnd: tenant?.leaseEnd || '',
    rentAmount: tenant?.rentAmount || '',
    deposit: tenant?.deposit || '',
    status: tenant?.status || 'active'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.propertyId || !formData.rentAmount) {
      alert('Please fill in all required fields');
      return;
    }

    const tenantData = {
      ...formData,
      id: tenant?.id || Date.now().toString(),
      rentAmount: parseFloat(formData.rentAmount) || 0,
      deposit: parseFloat(formData.deposit) || 0
    };

    onSave(tenantData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };


  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{tenant ? 'Edit Tenant' : 'Add New Tenant'}</h2>
          <button className="close-btn" onClick={onCancel}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label>Property *</label>
            <select
              name="propertyId"
              value={formData.propertyId}
              onChange={handleChange}
              className="form-control"
              required
            >
              <option value="">Select a property</option>
              {properties.map(property => (
                <option key={property.id} value={property.id}>
                  {property.name} - {property.address}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Lease Start</label>
              <input
                type="date"
                name="leaseStart"
                value={formData.leaseStart}
                onChange={handleChange}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>Lease End</label>
              <input
                type="date"
                name="leaseEnd"
                value={formData.leaseEnd}
                onChange={handleChange}
                className="form-control"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Monthly Rent *</label>
              <input
                type="number"
                name="rentAmount"
                value={formData.rentAmount}
                onChange={handleChange}
                className="form-control"
                step="0.01"
                min="0"
                required
              />
            </div>
            <div className="form-group">
              <label>Security Deposit</label>
              <input
                type="number"
                name="deposit"
                value={formData.deposit}
                onChange={handleChange}
                className="form-control"
                step="0.01"
                min="0"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="form-control"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <SecondaryButton type="button" onClick={onCancel}>Cancel</SecondaryButton>
            <PrimaryButton type="submit">Save Tenant</PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}

function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tenantsData, propertiesData] = await Promise.all([
        apiService.getTenants(),
        apiService.getProperties()
      ]);
      setTenants(tenantsData || []);
      setProperties(propertiesData || []);
      setError(null);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTenant = () => {
    if (properties.length === 0) {
      alert('Please add at least one property before adding tenants');
      return;
    }
    setEditingTenant(null);
    setShowForm(true);
  };

  const handleEditTenant = (tenant) => {
    setEditingTenant(tenant);
    setShowForm(true);
  };

  const handleSaveTenant = async (tenantData) => {
    try {
      if (editingTenant) {
        await apiService.updateTenant(editingTenant.id, tenantData);
      } else {
        await apiService.createTenant(tenantData);
      }
      await loadData(); // Reload data from server
      setShowForm(false);
      setEditingTenant(null);
    } catch (err) {
      alert('Failed to save tenant. Please try again.');
      console.error('Error saving tenant:', err);
    }
  };

  const handleDeleteTenant = async (id) => {
    if (window.confirm('Are you sure you want to delete this tenant?')) {
      try {
        await apiService.deleteTenant(id);
        await loadData(); // Reload data from server
      } catch (err) {
        alert('Failed to delete tenant. Please try again.');
        console.error('Error deleting tenant:', err);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTenant(null);
  };

  const getPropertyName = (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    return property ? property.name : 'Unknown Property';
  };

  const getStatusBadge = (status) => {
    const colors = {
      active: '#28a745',
      inactive: '#6c757d',
      pending: '#ffc107'
    };
    return (
      <span
        style={{
          backgroundColor: colors[status] || colors.inactive,
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          textTransform: 'capitalize'
        }}
      >
        {status}
      </span>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Tenants</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <SecondaryButton onClick={() => setShowInviteModal(true)}>
            📧 Invite Tenant
          </SecondaryButton>
          <PrimaryButton onClick={handleAddTenant}>
            Add New Tenant
          </PrimaryButton>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <p>Loading tenants...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#dc3545' }}>
            <p>{error}</p>
            <PrimaryButton onClick={loadData}>
              Try Again
            </PrimaryButton>
          </div>
        ) : tenants.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <h3>No tenants yet</h3>
            <p>Add your first tenant to start tracking rent payments</p>
            {properties.length === 0 && (
              <p style={{ color: '#dc3545', marginTop: '10px' }}>
                Note: You need to add properties first before adding tenants
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Property</th>
                    <th>Monthly Rent</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map(tenant => (
                    <tr key={tenant.id}>
                      <td>{tenant.name}</td>
                      <td>{tenant.email}</td>
                      <td>{tenant.phone || 'N/A'}</td>
                      <td>{getPropertyName(tenant.propertyId)}</td>
                      <td>${tenant.rentAmount.toLocaleString()}</td>
                      <td>{getStatusBadge(tenant.status)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <PrimaryButton
                            onClick={() => handleEditTenant(tenant)}
                            title="Edit Tenant"
                            style={{ padding: '6px 10px', minWidth: '36px' }}
                          >
                            ✏️
                          </PrimaryButton>
                          <DangerButton
                            onClick={() => handleDeleteTenant(tenant.id)}
                            title="Delete Tenant"
                            style={{ padding: '6px 10px', minWidth: '36px' }}
                          >
                            🗑️
                          </DangerButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Mobile Card View */}
            <div className="card-list">
              {tenants.map(tenant => (
                <div key={tenant.id} className="card-item">
                  <div className="card-item-header">{tenant.name}</div>
                  <div className="card-item-details">
                    <div className="card-item-detail">
                      <span className="card-item-label">Email:</span>
                      <span className="card-item-value">{tenant.email}</span>
                    </div>
                    <div className="card-item-detail">
                      <span className="card-item-label">Phone:</span>
                      <span className="card-item-value">{tenant.phone || 'N/A'}</span>
                    </div>
                    <div className="card-item-detail">
                      <span className="card-item-label">Property:</span>
                      <span className="card-item-value">{getPropertyName(tenant.propertyId)}</span>
                    </div>
                    <div className="card-item-detail">
                      <span className="card-item-label">Monthly Rent:</span>
                      <span className="card-item-value">${tenant.rentAmount.toLocaleString()}</span>
                    </div>
                    <div className="card-item-detail">
                      <span className="card-item-label">Status:</span>
                      <span className="card-item-value">{getStatusBadge(tenant.status)}</span>
                    </div>
                  </div>
                  <div className="card-item-actions" style={{ gap: '8px' }}>
                    <PrimaryButton
                      onClick={() => handleEditTenant(tenant)}
                      title="Edit Tenant"
                      style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      ✏️
                    </PrimaryButton>
                    <DangerButton
                      onClick={() => handleDeleteTenant(tenant.id)}
                      title="Delete Tenant"
                      style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      🗑️
                    </DangerButton>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showForm && (
        <TenantForm
          tenant={editingTenant}
          onSave={handleSaveTenant}
          onCancel={handleCancel}
          properties={properties}
        />
      )}

      {showInviteModal && (
        <InviteTenantModal
          onClose={() => {
            setShowInviteModal(false);
            loadData(); // Reload to show any new tenants
          }}
          properties={properties}
        />
      )}
    </div>
  );
}

export default Tenants;