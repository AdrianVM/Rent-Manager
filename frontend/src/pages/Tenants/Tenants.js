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

  // Format dates for input fields (convert from ISO to YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    email: tenant?.email || '',
    phone: tenant?.phone || '',
    propertyId: tenant?.propertyId || '',
    leaseStart: formatDateForInput(tenant?.leaseStart) || '',
    leaseEnd: formatDateForInput(tenant?.leaseEnd) || '',
    rentAmount: tenant?.rentAmount || '',
    deposit: tenant?.deposit || '',
    status: tenant?.status || 'Active' // Must match enum: Active, Inactive, Pending
  });

  const [personDetails, setPersonDetails] = useState({
    firstName: tenant?.person?.firstName || '',
    lastName: tenant?.person?.lastName || '',
    dateOfBirth: formatDateForInput(tenant?.person?.dateOfBirth) || '',
    idNumber: tenant?.person?.idNumber || '',
    nationality: tenant?.person?.nationality || '',
    occupation: tenant?.person?.occupation || '',
    emergencyContactName: tenant?.emergencyContactName || '',
    emergencyContactPhone: tenant?.emergencyContactPhone || '',
    emergencyContactRelation: tenant?.emergencyContactRelation || ''
  });

  const [companyDetails, setCompanyDetails] = useState({
    companyName: tenant?.company?.companyName || '',
    taxId: tenant?.company?.taxId || '',
    registrationNumber: tenant?.company?.registrationNumber || '',
    legalForm: tenant?.company?.legalForm || '',
    industry: tenant?.company?.industry || '',
    contactPersonName: tenant?.company?.contactPersonName || '',
    contactPersonTitle: tenant?.company?.contactPersonTitle || '',
    contactPersonEmail: tenant?.company?.contactPersonEmail || '',
    contactPersonPhone: tenant?.company?.contactPersonPhone || '',
    billingAddress: tenant?.company?.billingAddress || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate common fields
    if (!formData.email || !formData.propertyId || !formData.rentAmount) {
      alert('Please fill in all required fields: Email, Property, and Monthly Rent');
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

    // Capitalize first letter for enum values
    const capitalizeFirst = (str) => str.charAt(0).toUpperCase() + str.slice(1);

    // Convert date string (YYYY-MM-DD) to UTC ISO string for backend
    const dateToUTC = (dateString) => {
      if (!dateString) return null;
      const date = new Date(dateString + 'T00:00:00Z'); // Force UTC interpretation
      return date.toISOString();
    };

    const tenantData = {
      email: formData.email.trim(),
      phone: formData.phone?.trim() || null,
      propertyId: formData.propertyId,
      leaseStart: dateToUTC(formData.leaseStart),
      leaseEnd: dateToUTC(formData.leaseEnd),
      rentAmount: parseFloat(formData.rentAmount) || 0,
      deposit: formData.deposit ? parseFloat(formData.deposit) : null,
      status: capitalizeFirst(formData.status || 'active'), // Must be Active, Inactive, or Pending
      tenantType: capitalizeFirst(tenantType), // Must be Person or Company
      personId: tenant?.personId || null,
      companyId: tenant?.companyId || null,
      emergencyContactName: tenantType === 'person' ? (personDetails.emergencyContactName?.trim() || null) : null,
      emergencyContactPhone: tenantType === 'person' ? (personDetails.emergencyContactPhone?.trim() || null) : null,
      emergencyContactRelation: tenantType === 'person' ? (personDetails.emergencyContactRelation?.trim() || null) : null
    };

    console.log('Submitting tenant data:', JSON.stringify(tenantData, null, 2));
    console.log('Tenant being edited:', tenant);
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
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Pending">Pending</option>
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
      console.log('Saving tenant data:', tenantData);
      if (editingTenant) {
        const response = await apiService.updateTenant(editingTenant.id, tenantData);
        console.log('Update response:', response);
      } else {
        const response = await apiService.createTenant(tenantData);
        console.log('Create response:', response);
      }
      await loadData(); // Reload data from server
      setShowForm(false);
      setEditingTenant(null);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error';
      alert(`Failed to save tenant: ${errorMessage}`);
      console.error('Error saving tenant:', err);
      console.error('Error response:', err.response);
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