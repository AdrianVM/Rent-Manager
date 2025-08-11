import React, { useState } from 'react';

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

  const getPropertyName = (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    return property ? property.name : '';
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
            <button type="button" className="btn" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Tenant</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Tenants({ tenants, setTenants, properties }) {
  const [showForm, setShowForm] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);

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

  const handleSaveTenant = (tenantData) => {
    if (editingTenant) {
      setTenants(prev => prev.map(t => t.id === editingTenant.id ? tenantData : t));
    } else {
      setTenants(prev => [...prev, tenantData]);
    }
    setShowForm(false);
    setEditingTenant(null);
  };

  const handleDeleteTenant = (id) => {
    if (window.confirm('Are you sure you want to delete this tenant?')) {
      setTenants(prev => prev.filter(t => t.id !== id));
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
        <button className="btn btn-primary" onClick={handleAddTenant}>
          Add New Tenant
        </button>
      </div>

      <div className="card">
        {tenants.length === 0 ? (
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
                        <button
                          className="btn btn-primary"
                          onClick={() => handleEditTenant(tenant)}
                          style={{ marginRight: '10px' }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDeleteTenant(tenant.id)}
                        >
                          Delete
                        </button>
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
                  <div className="card-item-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => handleEditTenant(tenant)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeleteTenant(tenant.id)}
                    >
                      Delete
                    </button>
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
    </div>
  );
}

export default Tenants;