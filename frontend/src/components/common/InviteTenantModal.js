import React, { useState } from 'react';
import { PrimaryButton, SecondaryButton } from './';
import apiService from '../../services/api';

function InviteTenantModal({ onClose, properties = [] }) {
  const [formData, setFormData] = useState({
    propertyId: '',
    email: '',
    rentAmount: '',
    leaseStart: '',
    leaseEnd: '',
    deposit: ''
  });
  const [loading, setLoading] = useState(false);
  const [invitationLink, setInvitationLink] = useState(null);

  console.log('InviteTenantModal - properties:', properties);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.propertyId || !formData.email) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      const result = await apiService.createTenantInvitation({
        propertyId: formData.propertyId,
        email: formData.email,
        rentAmount: formData.rentAmount ? parseFloat(formData.rentAmount) : null,
        leaseStart: formData.leaseStart || null,
        leaseEnd: formData.leaseEnd || null,
        deposit: formData.deposit ? parseFloat(formData.deposit) : null
      });

      setInvitationLink(result.invitationLink);
    } catch (err) {
      alert('Error creating invitation: ' + err.message);
      console.error('Error creating invitation:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(invitationLink);
    alert('Invitation link copied to clipboard!');
  };

  if (invitationLink) {
    return (
      <div className="modal">
        <div className="modal-content">
          <div className="modal-header">
            <h2>✓ Invitation Created Successfully!</h2>
            <button className="close-btn" onClick={onClose}>&times;</button>
          </div>
          <div style={{ padding: '20px' }}>
            <p style={{ marginBottom: '15px', color: 'var(--text-secondary)' }}>
              Share this link with your tenant to complete their onboarding:
            </p>
            <div style={{
              padding: '15px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              wordBreak: 'break-all',
              marginBottom: '15px',
              fontFamily: 'monospace',
              fontSize: '13px'
            }}>
              {invitationLink}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <PrimaryButton onClick={copyToClipboard}>
                📋 Copy Link
              </PrimaryButton>
              <SecondaryButton onClick={onClose}>
                Done
              </SecondaryButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Invite New Tenant</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
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
              {properties && properties.length > 0 ? (
                properties.map(property => (
                  <option key={property.id} value={property.id}>
                    {property.name} - {property.address}
                  </option>
                ))
              ) : (
                <option value="" disabled>No properties available</option>
              )}
            </select>
            {properties && properties.length === 0 && (
              <p style={{ color: 'var(--danger-color)', fontSize: '12px', marginTop: '5px' }}>
                Please add at least one property before inviting tenants.
              </p>
            )}
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-control"
              placeholder="tenant@example.com"
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Monthly Rent</label>
              <input
                type="number"
                name="rentAmount"
                value={formData.rentAmount}
                onChange={handleChange}
                className="form-control"
                step="0.01"
                placeholder="0.00"
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
                placeholder="0.00"
              />
            </div>
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <SecondaryButton type="button" onClick={onClose}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Invitation'}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InviteTenantModal;
