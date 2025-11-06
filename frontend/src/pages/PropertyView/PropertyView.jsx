import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import { PrimaryButton, SecondaryButton, DangerButton } from '../../components/common';
import PropertyOverviewCard from './components/PropertyOverviewCard';
import PropertyDetailsGrid from './components/PropertyDetailsGrid';
import PropertyLeaseInfo from './components/PropertyLeaseInfo';
import PropertyLocationMap from './components/PropertyLocationMap';
import PropertyContracts from './components/PropertyContracts';
import './PropertyView.css';

// PropertyForm component - extracted from Properties.js
function PropertyForm({ property, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: property?.name || '',
    address: property?.address || '',
    type: property?.type || 'apartment',
    bedrooms: property?.bedrooms || '',
    bathrooms: property?.bathrooms || '',
    rentAmount: property?.rentAmount || '',
    description: property?.description || '',
    parkingType: property?.parkingType || 'outdoor',
    spaceNumber: property?.spaceNumber || '',
    squareFootage: property?.squareFootage || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.address || !formData.rentAmount) {
      alert('Please fill in all required fields');
      return;
    }

    const propertyData = {
      ...formData,
      id: property?.id || Date.now().toString(),
      bedrooms: parseInt(formData.bedrooms) || 0,
      bathrooms: parseInt(formData.bathrooms) || 0,
      rentAmount: parseFloat(formData.rentAmount) || 0
    };

    onSave(propertyData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{property ? 'Edit Property' : 'Add New Property'}</h2>
          <button className="close-btn" onClick={onCancel}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Property Name *</label>
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
            <label>Address *</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>
          <div className="form-group">
            <label>Property Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="form-control"
            >
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="condo">Condo</option>
              <option value="commercial">Commercial</option>
              <option value="parkingSpace">Parking Space</option>
            </select>
          </div>
          {(formData.type === 'apartment' || formData.type === 'house' || formData.type === 'condo') && (
            <div className="form-row">
              <div className="form-group">
                <label>Bedrooms</label>
                <input
                  type="number"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleChange}
                  className="form-control"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Bathrooms</label>
                <input
                  type="number"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleChange}
                  className="form-control"
                  min="0"
                  step="0.5"
                />
              </div>
            </div>
          )}
          {formData.type === 'parkingSpace' && (
            <div className="form-row">
              <div className="form-group">
                <label>Parking Type</label>
                <select
                  name="parkingType"
                  value={formData.parkingType || 'outdoor'}
                  onChange={handleChange}
                  className="form-control"
                >
                  <option value="outdoor">Outdoor</option>
                  <option value="covered">Covered</option>
                  <option value="garage">Garage</option>
                  <option value="underground">Underground</option>
                </select>
              </div>
              <div className="form-group">
                <label>Space Number</label>
                <input
                  type="text"
                  name="spaceNumber"
                  value={formData.spaceNumber || ''}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="e.g., A-15, P-003"
                />
              </div>
            </div>
          )}
          {formData.type === 'commercial' && (
            <div className="form-group">
              <label>Square Footage</label>
              <input
                type="number"
                name="squareFootage"
                value={formData.squareFootage || ''}
                onChange={handleChange}
                className="form-control"
                min="0"
                placeholder="Square feet"
              />
            </div>
          )}
          <div className="form-group">
            <label>Monthly Rent Amount *</label>
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
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-control"
              rows="3"
            />
          </div>
          <div className="property-form-actions">
            <SecondaryButton type="button" onClick={onCancel}>Cancel</SecondaryButton>
            <PrimaryButton type="submit">Save Property</PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}

function PropertyView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    loadPropertyData();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadPropertyData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load data in parallel for better performance
      const [propertyData, contractsData, tenantsData] = await Promise.all([
        apiService.getProperty(id),
        apiService.getContractsByProperty(id),
        apiService.getTenants()
      ]);

      setProperty(propertyData);
      setContracts(contractsData || []);

      // Find tenant associated with this property
      const propertyTenant = tenantsData?.find(t => t.propertyId === id);
      setTenant(propertyTenant || null);
    } catch (err) {
      console.error('Error loading property data:', err);
      setError('Failed to load property details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/properties');
  };

  const handleEdit = () => {
    setShowEditForm(true);
  };

  const handleSaveProperty = async (propertyData) => {
    try {
      await apiService.updateProperty(id, propertyData);
      setShowEditForm(false);
      await loadPropertyData(); // Reload to show updated data
    } catch (err) {
      alert('Failed to save property. Please try again.');
      console.error('Error saving property:', err);
    }
  };

  const handleCancelEdit = () => {
    setShowEditForm(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      try {
        await apiService.deleteProperty(id);
        navigate('/properties');
      } catch (err) {
        alert('Failed to delete property. Please try again.');
        console.error('Error deleting property:', err);
      }
    }
  };

  const handleContractsUpdate = () => {
    // Reload contracts after upload/delete
    loadPropertyData();
  };

  if (loading) {
    return (
      <div className="property-view-container">
        <div className="property-view-loading">
          <p>Loading property details...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="property-view-container">
        <div className="property-view-error">
          <h3>Unable to Load Property</h3>
          <p>{error || 'Property not found'}</p>
          <SecondaryButton onClick={handleBack}>
            Back to Properties
          </SecondaryButton>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="property-view-container">
        {/* Header Section */}
        <div className="property-view-header">
          <SecondaryButton onClick={handleBack} className="property-view-back-btn">
            ← Back to Properties
          </SecondaryButton>
          <div className="property-view-header-actions">
            <PrimaryButton onClick={handleEdit}>
              ✏️ Edit Property
            </PrimaryButton>
            <DangerButton onClick={handleDelete}>
              🗑️ Delete Property
            </DangerButton>
          </div>
        </div>

        {/* Property Overview Card */}
        <PropertyOverviewCard property={property} />

        {/* Property Details Grid */}
        <PropertyDetailsGrid property={property} />

        {/* Description Section - Only show if description exists */}
        {property.description && (
          <div className="property-view-section">
            <div className="property-view-card">
              <h2 className="property-view-section-title">Description</h2>
              <p className="property-view-description">{property.description}</p>
            </div>
          </div>
        )}

        {/* Lease & Tenant Information - Only show if tenant exists */}
        {tenant && (
          <PropertyLeaseInfo tenant={tenant} />
        )}

        {/* Location Map Section */}
        <div className="property-view-section">
          <div className="property-view-card">
            <h2 className="property-view-section-title">Location</h2>
            <PropertyLocationMap property={property} />
          </div>
        </div>

        {/* Contracts Section */}
        <PropertyContracts
          property={property}
          contracts={contracts}
          onUpdate={handleContractsUpdate}
        />

        {/* Phase 2 Placeholders - Commented out for future implementation */}
        {/*
        <div className="property-view-section">
          <div className="property-view-card">
            <h2 className="property-view-section-title">Maintenance Requests</h2>
            <p className="property-view-placeholder">Coming Soon</p>
          </div>
        </div>

        <div className="property-view-section">
          <div className="property-view-card">
            <h2 className="property-view-section-title">Payment History</h2>
            <p className="property-view-placeholder">Coming Soon</p>
          </div>
        </div>
        */}
      </div>

      {/* Edit Property Modal */}
      {showEditForm && (
        <PropertyForm
          property={property}
          onSave={handleSaveProperty}
          onCancel={handleCancelEdit}
        />
      )}
    </>
  );
}

export default PropertyView;
