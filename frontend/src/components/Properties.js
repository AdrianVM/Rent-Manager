import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

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
          {/* Only show bedrooms/bathrooms for residential properties */}
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
          
          {/* Show parking-specific fields for parking spaces */}
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
          
          {/* Show square footage for commercial properties */}
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
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button type="button" className="btn" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Property</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Properties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const data = await apiService.getProperties();
      setProperties(data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load properties. Please try again.');
      console.error('Error loading properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProperty = () => {
    setEditingProperty(null);
    setShowForm(true);
  };

  const handleEditProperty = (property) => {
    setEditingProperty(property);
    setShowForm(true);
  };

  const handleSaveProperty = async (propertyData) => {
    try {
      if (editingProperty) {
        await apiService.updateProperty(editingProperty.id, propertyData);
      } else {
        await apiService.createProperty(propertyData);
      }
      await loadProperties(); // Reload data from server
      setShowForm(false);
      setEditingProperty(null);
    } catch (err) {
      alert('Failed to save property. Please try again.');
      console.error('Error saving property:', err);
    }
  };

  const handleDeleteProperty = async (id) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await apiService.deleteProperty(id);
        await loadProperties(); // Reload data from server
      } catch (err) {
        alert('Failed to delete property. Please try again.');
        console.error('Error deleting property:', err);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProperty(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Properties</h1>
        <button className="btn btn-primary" onClick={handleAddProperty}>
          Add New Property
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <p>Loading properties...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#dc3545' }}>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={loadProperties}>
              Try Again
            </button>
          </div>
        ) : properties.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <h3>No properties yet</h3>
            <p>Add your first property to get started managing rentals</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Address</th>
                    <th>Type</th>
                    <th>Details</th>
                    <th>Monthly Rent</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map(property => {
                    const getPropertyDetails = (prop) => {
                      switch (prop.type) {
                        case 'apartment':
                        case 'house':
                        case 'condo':
                          return `${prop.bedrooms || 0}/${prop.bathrooms || 0} bed/bath`;
                        case 'parkingSpace':
                          const details = [];
                          if (prop.parkingType) details.push(prop.parkingType.replace('_', ' '));
                          if (prop.spaceNumber) details.push(`#${prop.spaceNumber}`);
                          return details.join(' • ') || 'Parking';
                        case 'commercial':
                          return prop.squareFootage ? `${prop.squareFootage.toLocaleString()} sq ft` : 'Commercial';
                        default:
                          return 'N/A';
                      }
                    };
                    
                    return (
                      <tr key={property.id}>
                        <td>{property.name}</td>
                        <td>{property.address}</td>
                        <td style={{ textTransform: 'capitalize' }}>
                          {property.type.replace('_', ' ')}
                        </td>
                        <td>{getPropertyDetails(property)}</td>
                        <td>${property.rentAmount.toLocaleString()}</td>
                        <td>
                          <button
                            className="btn btn-primary"
                            onClick={() => handleEditProperty(property)}
                            style={{ marginRight: '10px' }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleDeleteProperty(property.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Mobile Card View */}
            <div className="card-list">
              {properties.map(property => {
                const getPropertyDetails = (prop) => {
                  switch (prop.type) {
                    case 'apartment':
                    case 'house':
                    case 'condo':
                      return `${prop.bedrooms || 0}/${prop.bathrooms || 0} bed/bath`;
                    case 'parkingSpace':
                      const details = [];
                      if (prop.parkingType) details.push(prop.parkingType.replace('_', ' '));
                      if (prop.spaceNumber) details.push(`#${prop.spaceNumber}`);
                      return details.join(' • ') || 'Parking';
                    case 'commercial':
                      return prop.squareFootage ? `${prop.squareFootage.toLocaleString()} sq ft` : 'Commercial';
                    default:
                      return 'N/A';
                  }
                };
                
                return (
                  <div key={property.id} className="card-item">
                    <div className="card-item-header">{property.name}</div>
                    <div className="card-item-details">
                      <div className="card-item-detail">
                        <span className="card-item-label">Address:</span>
                        <span className="card-item-value">{property.address}</span>
                      </div>
                      <div className="card-item-detail">
                        <span className="card-item-label">Type:</span>
                        <span className="card-item-value" style={{ textTransform: 'capitalize' }}>
                          {property.type.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="card-item-detail">
                        <span className="card-item-label">Details:</span>
                        <span className="card-item-value">{getPropertyDetails(property)}</span>
                      </div>
                      <div className="card-item-detail">
                        <span className="card-item-label">Monthly Rent:</span>
                        <span className="card-item-value">${property.rentAmount.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="card-item-actions">
                      <button
                        className="btn btn-primary"
                        onClick={() => handleEditProperty(property)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDeleteProperty(property.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {showForm && (
        <PropertyForm
          property={editingProperty}
          onSave={handleSaveProperty}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}

export default Properties;