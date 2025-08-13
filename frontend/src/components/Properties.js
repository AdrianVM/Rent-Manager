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

function ContractUpload({ property, tenants, onClose, onUpload }) {
  const [file, setFile] = useState(null);
  const [tenantId, setTenantId] = useState('');
  const [status, setStatus] = useState('draft');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  const propertyTenants = tenants.filter(t => t.propertyId === property.id);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !tenantId) {
      alert('Please select a file and tenant');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1];
        const contractData = {
          propertyId: property.id,
          tenantId,
          fileName: file.name,
          fileContentBase64: base64,
          mimeType: file.type,
          fileSizeBytes: file.size,
          status,
          notes
        };

        await apiService.uploadContract(contractData);
        onUpload();
        onClose();
      };
      reader.readAsDataURL(file);
    } catch (err) {
      alert('Failed to upload contract. Please try again.');
      console.error('Error uploading contract:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Upload Contract for {property.name}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Contract File *</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="form-control"
              required
            />
            <small style={{ color: 'var(--text-secondary)' }}>
              Supported formats: PDF, DOC, DOCX (Max 10MB)
            </small>
          </div>
          <div className="form-group">
            <label>Tenant *</label>
            <select
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              className="form-control"
              required
            >
              <option value="">Select a tenant</option>
              {propertyTenants.map(tenant => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="form-control"
            >
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="signed">Signed</option>
            </select>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-control"
              rows="3"
              placeholder="Optional notes about the contract"
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload Contract'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ContractViewer({ contract, onClose }) {
  const [loading, setLoading] = useState(true);
  const [contractData, setContractData] = useState(null);

  useEffect(() => {
    loadContractData();
  }, [contract.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadContractData = async () => {
    try {
      setLoading(true);
      const data = await apiService.getContract(contract.id);
      setContractData(data);
    } catch (err) {
      console.error('Error loading contract data:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderContract = () => {
    if (!contractData || !contractData.fileContentBase64) {
      return <div>No contract content available</div>;
    }

    const mimeType = contractData.mimeType || '';
    
    if (mimeType.includes('pdf')) {
      const blob = new Blob([Uint8Array.from(atob(contractData.fileContentBase64), c => c.charCodeAt(0))], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      return (
        <iframe
          src={url}
          style={{ width: '100%', height: '600px', border: 'none' }}
          title="Contract Viewer"
        />
      );
    } else {
      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '20px' }}>📄</div>
          <p>This file format cannot be previewed in the browser.</p>
          <p>File type: {mimeType}</p>
          <p>Please download the file to view its contents.</p>
        </div>
      );
    }
  };

  return (
    <div className="modal">
      <div className="modal-content" style={{ maxWidth: '900px', height: '80vh' }}>
        <div className="modal-header">
          <h2>View Contract: {contract.fileName}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div style={{ padding: '20px', height: 'calc(100% - 60px)', overflow: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              Loading contract...
            </div>
          ) : (
            renderContract()
          )}
        </div>
      </div>
    </div>
  );
}

function ContractsView({ property, onClose, onUpdate }) {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState([]);
  const [viewingContract, setViewingContract] = useState(null);

  useEffect(() => {
    loadContracts();
    loadTenants();
  }, [property.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadContracts = async () => {
    try {
      setLoading(true);
      const data = await apiService.getContractsByProperty(property.id);
      setContracts(data || []);
    } catch (err) {
      console.error('Error loading contracts:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTenants = async () => {
    try {
      const data = await apiService.getTenants();
      setTenants(data || []);
    } catch (err) {
      console.error('Error loading tenants:', err);
    }
  };

  const getTenantName = (tenantId) => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant ? tenant.name : 'Unknown Tenant';
  };

  const getStatusBadge = (status) => {
    const colors = {
      draft: '#6c757d',
      pending: '#ffc107',
      signed: '#28a745',
      terminated: '#dc3545'
    };
    return (
      <span
        style={{
          backgroundColor: colors[status] || colors.draft,
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

  const handleDownload = async (contract) => {
    try {
      const response = await apiService.downloadContract(contract.id);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = contract.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Failed to download contract');
      console.error('Error downloading contract:', err);
    }
  };

  const handleDelete = async (contractId) => {
    if (window.confirm('Are you sure you want to delete this contract?')) {
      try {
        await apiService.deleteContract(contractId);
        loadContracts();
      } catch (err) {
        alert('Failed to delete contract');
        console.error('Error deleting contract:', err);
      }
    }
  };

  return (
    <div className="modal">
      <div className="modal-content" style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <h2>Contracts for {property.name}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div style={{ padding: '20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              Loading contracts...
            </div>
          ) : contracts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              <p>No contracts uploaded for this property</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {contracts.map(contract => (
                <div
                  key={contract.id}
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '16px',
                    backgroundColor: 'var(--bg-tertiary)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                        {contract.fileName}
                      </h4>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                        Tenant: {getTenantName(contract.tenantId)}
                      </div>
                    </div>
                    {getStatusBadge(contract.status)}
                  </div>
                  {contract.notes && (
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      Notes: {contract.notes}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <span>
                      Uploaded: {new Date(contract.uploadedAt).toLocaleDateString()}
                      {contract.signedAt && ` • Signed: ${new Date(contract.signedAt).toLocaleDateString()}`}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-accent"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        onClick={() => setViewingContract(contract)}
                      >
                        View
                      </button>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        onClick={() => handleDownload(contract)}
                      >
                        Download
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        onClick={() => handleDelete(contract.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {viewingContract && (
          <ContractViewer
            contract={viewingContract}
            onClose={() => setViewingContract(null)}
          />
        )}
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
  const [showContractUpload, setShowContractUpload] = useState(false);
  const [showContractsView, setShowContractsView] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [tenants, setTenants] = useState([]);

  useEffect(() => {
    loadProperties();
    loadTenants();
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

  const loadTenants = async () => {
    try {
      const data = await apiService.getTenants();
      setTenants(data || []);
    } catch (err) {
      console.error('Error loading tenants:', err);
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

  const handleUploadContract = (property) => {
    setSelectedProperty(property);
    setShowContractUpload(true);
  };

  const handleViewContracts = (property) => {
    setSelectedProperty(property);
    setShowContractsView(true);
  };

  const handleContractUploadComplete = () => {
    setShowContractUpload(false);
    setSelectedProperty(null);
  };

  const handleContractsViewClose = () => {
    setShowContractsView(false);
    setSelectedProperty(null);
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
                            style={{ marginRight: '8px' }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-accent"
                            onClick={() => handleUploadContract(property)}
                            style={{ marginRight: '8px' }}
                          >
                            Upload Contract
                          </button>
                          <button
                            className="btn"
                            onClick={() => handleViewContracts(property)}
                            style={{ marginRight: '8px' }}
                          >
                            View Contracts
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
                        className="btn btn-accent"
                        onClick={() => handleUploadContract(property)}
                      >
                        Upload Contract
                      </button>
                      <button
                        className="btn"
                        onClick={() => handleViewContracts(property)}
                      >
                        View Contracts
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

      {showContractUpload && selectedProperty && (
        <ContractUpload
          property={selectedProperty}
          tenants={tenants}
          onClose={handleContractUploadComplete}
          onUpload={handleContractUploadComplete}
        />
      )}

      {showContractsView && selectedProperty && (
        <ContractsView
          property={selectedProperty}
          onClose={handleContractsViewClose}
          onUpdate={handleContractsViewClose}
        />
      )}
    </div>
  );
}

export default Properties;