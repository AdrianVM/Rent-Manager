import React, { useState } from 'react';
import { PrimaryButton, SecondaryButton } from './common';
import apiService from '../services/api';

function MaintenanceRequestModal({ onClose, onSuccess, tenantId, propertyId }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.description) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await apiService.createMaintenanceRequest({
        tenantId,
        propertyId,
        title: formData.title,
        description: formData.description,
        priority: formData.priority
      });

      console.log('Maintenance request created successfully:', result);

      // Call onSuccess first to reload the list
      await onSuccess();

      // Then close the modal
      onClose();
    } catch (err) {
      setError('Error submitting maintenance request: ' + err.message);
      console.error('Error creating maintenance request:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Submit Maintenance Request</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          {error && (
            <div style={{
              padding: '12px',
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '6px',
              marginBottom: '15px',
              color: '#c33'
            }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="priority">Priority *</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="form-control"
              required
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Emergency">Emergency</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="title">Issue Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="form-control"
              placeholder="e.g., Leaky Faucet in Kitchen"
              required
              maxLength={255}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-control"
              placeholder="Please provide detailed information about the issue..."
              required
              rows="5"
              maxLength={2000}
              style={{ resize: 'vertical', minHeight: '100px' }}
            />
            <div style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              marginTop: '5px',
              textAlign: 'right'
            }}>
              {formData.description.length} / 2000 characters
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <SecondaryButton type="button" onClick={onClose} disabled={loading}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Request'}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MaintenanceRequestModal;
