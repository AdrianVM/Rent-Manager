import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import InviteTenantModal from '../../components/common/InviteTenantModal';
import { PrimaryButton, SecondaryButton, DangerButton, Table } from '../../components/common';
import TenantTypeSelector from '../../components/tenants/TenantTypeSelector';
import PersonTenantForm from '../../components/tenants/PersonTenantForm';
import CompanyTenantForm from '../../components/tenants/CompanyTenantForm';
import './Tenants.css';

function TenantForm({ tenant, onSave, onCancel, properties }) {
  const [tenantType, setTenantType] = useState(tenant?.tenantType?.toLowerCase() || 'person');
  const [formData, setFormData] = useState({
    email: tenant?.email || '',
    phone: tenant?.phone || '',
    propertyId: tenant?.propertyId || '',
    leaseStart: tenant?.leaseStart || '',
    leaseEnd: tenant?.leaseEnd || '',
    rentAmount: tenant?.rentAmount || '',
    deposit: tenant?.deposit || '',
    status: tenant?.status || 'active'
  });

  const [personDetails, setPersonDetails] = useState(tenant?.personDetails || {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    idNumber: '',
    nationality: '',
    occupation: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: ''
  });

  const [companyDetails, setCompanyDetails] = useState(tenant?.companyDetails || {
    companyName: '',
    taxId: '',
    registrationNumber: '',
    legalForm: '',
    industry: '',
    contactPersonName: '',
    contactPersonTitle: '',
    contactPersonEmail: '',
    contactPersonPhone: '',
    billingAddress: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate common fields
    if (!formData.email || !formData.propertyId || !formData.rentAmount) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate type-specific fields
    if (tenantType === 'person') {
      if (!personDetails.firstName || !personDetails.lastName) {
        alert('Please enter first and last name for person tenant');
        return;
      }
    } else {
      if (!companyDetails.companyName) {
        alert('Please enter company name for company tenant');
        return;
      }
    }

    const tenantData = {
      ...formData,
      id: tenant?.id || Date.now().toString(),
      tenantType: tenantType,
      rentAmount: parseFloat(formData.rentAmount) || 0,
      deposit: parseFloat(formData.deposit) || 0,
      personDetails: tenantType === 'person' ? personDetails : null,
      companyDetails: tenantType === 'company' ? companyDetails : null
    };

    onSave(tenantData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTenantTypeChange = (newType) => {
    setTenantType(newType);
  };


  return (
    <div className="modal">
      <div className="modal-content tenant-form-modal-content">
        <div className="modal-header">
          <h2>{tenant ? 'Edit Tenant' : 'Add New Tenant'}</h2>
          <button className="close-btn" onClick={onCancel}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <TenantTypeSelector value={tenantType} onChange={handleTenantTypeChange} />

          {tenantType === 'person' && (
            <PersonTenantForm data={personDetails} onChange={setPersonDetails} />
          )}

          {tenantType === 'company' && (
            <CompanyTenantForm data={companyDetails} onChange={setCompanyDetails} />
          )}

          <h3 className="tenant-form-section-title">
            Lease Information
          </h3>

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
          <div className="tenant-form-actions">
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
    return (
      <span className={`status-badge ${status}`}>
        {status}
      </span>
    );
  };

  return (
    <>
      <div className="tenants-header">
        <h1>Tenants</h1>
        <div className="tenants-header-actions">
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
          <div className="tenants-loading">
            <p>Loading tenants...</p>
          </div>
        ) : error ? (
          <div className="tenants-error">
            <p>{error}</p>
            <PrimaryButton onClick={loadData}>
              Try Again
            </PrimaryButton>
          </div>
        ) : tenants.length === 0 ? (
          <div className="tenants-empty">
            <h3>No tenants yet</h3>
            <p>Add your first tenant to start tracking rent payments</p>
            {properties.length === 0 && (
              <p className="tenants-empty-warning">
                Note: You need to add properties first before adding tenants
              </p>
            )}
          </div>
        ) : (
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
                header: 'Phone',
                render: (tenant) => tenant.phone || 'N/A'
              },
              {
                header: 'Property',
                render: (tenant) => getPropertyName(tenant.propertyId)
              },
              {
                header: 'Monthly Rent',
                render: (tenant) => `$${tenant.rentAmount.toLocaleString()}`
              },
              {
                header: 'Status',
                render: (tenant) => getStatusBadge(tenant.status)
              },
              {
                header: 'Actions',
                render: (tenant) => (
                  <div className="tenants-action-buttons">
                    <PrimaryButton
                      onClick={() => handleEditTenant(tenant)}
                      title="Edit Tenant"
                      className="tenant-action-btn"
                    >
                      ✏️
                    </PrimaryButton>
                    <DangerButton
                      onClick={() => handleDeleteTenant(tenant.id)}
                      title="Delete Tenant"
                      className="tenant-action-btn"
                    >
                      🗑️
                    </DangerButton>
                  </div>
                )
              }
            ]}
            data={tenants}
            emptyMessage="No tenants yet"
            renderMobileCard={(tenant) => (
              <>
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
                <div className="card-item-actions tenants-mobile-actions">
                  <PrimaryButton
                    onClick={() => handleEditTenant(tenant)}
                    title="Edit Tenant"
                    className="tenants-mobile-action-btn"
                  >
                    ✏️
                  </PrimaryButton>
                  <DangerButton
                    onClick={() => handleDeleteTenant(tenant.id)}
                    title="Delete Tenant"
                    className="tenants-mobile-action-btn"
                  >
                    🗑️
                  </DangerButton>
                </div>
              </>
            )}
          />
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
    </>
  );
}

export default Tenants;