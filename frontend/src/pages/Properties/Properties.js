import React, { useState, useEffect, useRef } from 'react';
import apiService from '../../services/api';
import { renderAsync } from 'docx-preview';
import { PrimaryButton, SecondaryButton, DangerButton } from '../../components/common';
import './Properties.css';

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
          <div className="property-form-actions">
            <SecondaryButton type="button" onClick={onCancel}>Cancel</SecondaryButton>
            <PrimaryButton type="submit">Save Property</PrimaryButton>
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
            <small className="contract-upload-hint">
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
          <div className="property-form-actions">
            <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
            <PrimaryButton type="submit" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload Contract'}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}

function ContractViewer({ contract, onClose }) {
  const [loading, setLoading] = useState(true);
  const [contractData, setContractData] = useState(null);
  const [renderingDocx, setRenderingDocx] = useState(false);
  const docxContainerRef = useRef(null);

  useEffect(() => {
    loadContractData();
  }, [contract.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (contractData && docxContainerRef.current) {
      renderDocxIfNeeded();
    }
  }, [contractData]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const renderDocxIfNeeded = async () => {
    if (!contractData || !contractData.fileContentBase64 || !docxContainerRef.current) {
      return;
    }

    const mimeType = contractData.mimeType || '';
    
    if (mimeType.includes('wordprocessingml') || mimeType.includes('msword') || contractData.fileName.toLowerCase().endsWith('.docx') || contractData.fileName.toLowerCase().endsWith('.doc')) {
      setRenderingDocx(true);
      try {
        const arrayBuffer = Uint8Array.from(atob(contractData.fileContentBase64), c => c.charCodeAt(0)).buffer;
        
        await renderAsync(arrayBuffer, docxContainerRef.current, null, {
          className: 'docx-viewer',
          inWrapper: false,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          ignoreLastRenderedPageBreak: true,
          experimental: false,
          trimXmlDeclaration: true,
          useBase64URL: false,
          useMathMLPolyfill: false,
          renderChanges: false,
          renderComments: false,
          renderFootnotes: true,
          renderHeaders: true,
          renderFooters: true
        });
      } catch (error) {
        console.error('Error rendering DOCX:', error);
        if (docxContainerRef.current) {
          docxContainerRef.current.innerHTML = `
            <div class="contract-viewer-error">
              <div class="contract-viewer-error-icon">⚠️</div>
              <p>Error loading Word document</p>
              <p>Please download the file to view its contents.</p>
            </div>
          `;
        }
      } finally {
        setRenderingDocx(false);
      }
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
          className="contract-viewer-iframe"
          title="Contract Viewer"
        />
      );
    } else if (mimeType.includes('wordprocessingml') || mimeType.includes('msword') || contractData.fileName.toLowerCase().endsWith('.docx') || contractData.fileName.toLowerCase().endsWith('.doc')) {
      // Handle Word documents
      return (
        <div className="contract-viewer-docx-container">
          {renderingDocx && (
            <div className="contract-viewer-docx-loading">
              Rendering Word document...
            </div>
          )}
          <div
            ref={docxContainerRef}
            className="contract-viewer-docx-content"
          />
        </div>
      );
    } else {
      return (
        <div className="contract-viewer-unsupported">
          <div className="contract-viewer-unsupported-icon">📄</div>
          <p>This file format cannot be previewed in the browser.</p>
          <p>File type: {mimeType}</p>
          <p>Please download the file to view its contents.</p>
        </div>
      );
    }
  };

  return (
    <div className="modal">
      <div className="modal-content contract-viewer-modal-content">
        <div className="modal-header">
          <h2>View Contract: {contract.fileName}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="contract-viewer-content">
          {loading ? (
            <div className="contract-viewer-loading">
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
    return (
      <span className={`contract-status-badge ${status}`}>
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
      <div className="modal-content contracts-view-modal-content">
        <div className="modal-header">
          <h2>Contracts for {property.name}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="contracts-view-content">
          {loading ? (
            <div className="contracts-view-loading">
              Loading contracts...
            </div>
          ) : contracts.length === 0 ? (
            <div className="contracts-view-empty">
              <p>No contracts uploaded for this property</p>
            </div>
          ) : (
            <div className="contracts-list">
              {contracts.map(contract => (
                <div
                  key={contract.id}
                  className="contract-item"
                >
                  <div className="contract-item-header">
                    <div>
                      <h4 className="contract-item-title">
                        {contract.fileName}
                      </h4>
                      <div className="contract-item-tenant">
                        Tenant: {getTenantName(contract.tenantId)}
                      </div>
                    </div>
                    {getStatusBadge(contract.status)}
                  </div>
                  {contract.notes && (
                    <div className="contract-item-notes">
                      Notes: {contract.notes}
                    </div>
                  )}
                  <div className="contract-item-footer">
                    <span>
                      Uploaded: {new Date(contract.uploadedAt).toLocaleDateString()}
                      {contract.signedAt && ` • Signed: ${new Date(contract.signedAt).toLocaleDateString()}`}
                    </span>
                    <div className="contract-actions">
                      <SecondaryButton
                        className="contract-action-btn"
                        onClick={() => setViewingContract(contract)}
                        title="View Contract"
                      >
                        👁️
                      </SecondaryButton>
                      <PrimaryButton
                        className="contract-action-btn"
                        onClick={() => handleDownload(contract)}
                        title="Download Contract"
                      >
                        ⬇️
                      </PrimaryButton>
                      <DangerButton
                        className="contract-action-btn"
                        onClick={() => handleDelete(contract.id)}
                        title="Delete Contract"
                      >
                        🗑️
                      </DangerButton>
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
    <>
      <div className="properties-header">
        <h1>Properties</h1>
        <PrimaryButton onClick={handleAddProperty}>
          Add New Property
        </PrimaryButton>
      </div>

      <div className="card">
        {loading ? (
          <div className="properties-loading">
            <p>Loading properties...</p>
          </div>
        ) : error ? (
          <div className="properties-error">
            <p>{error}</p>
            <PrimaryButton onClick={loadProperties}>
              Try Again
            </PrimaryButton>
          </div>
        ) : properties.length === 0 ? (
          <div className="properties-empty">
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
                        <td className="property-type-text">
                          {property.type.replace('_', ' ')}
                        </td>
                        <td>{getPropertyDetails(property)}</td>
                        <td>${property.rentAmount.toLocaleString()}</td>
                        <td>
                          <div className="properties-action-buttons">
                            <PrimaryButton
                              onClick={() => handleEditProperty(property)}
                              title="Edit Property"
                              className="property-action-btn"
                            >
                              ✏️
                            </PrimaryButton>
                            <SecondaryButton
                              onClick={() => handleUploadContract(property)}
                              title="Upload Contract"
                              className="property-action-btn"
                            >
                              📤
                            </SecondaryButton>
                            <SecondaryButton
                              onClick={() => handleViewContracts(property)}
                              title="View Contracts"
                              className="property-action-btn"
                            >
                              👁️
                            </SecondaryButton>
                            <DangerButton
                              onClick={() => handleDeleteProperty(property.id)}
                              title="Delete Property"
                              className="property-action-btn"
                            >
                              🗑️
                            </DangerButton>
                          </div>
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
                        <span className="card-item-value property-type-text">
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
                    <div className="card-item-actions properties-mobile-actions">
                      <PrimaryButton
                        onClick={() => handleEditProperty(property)}
                        title="Edit Property"
                        className="properties-mobile-action-btn"
                      >
                        ✏️
                      </PrimaryButton>
                      <SecondaryButton
                        onClick={() => handleUploadContract(property)}
                        title="Upload Contract"
                        className="properties-mobile-action-btn"
                      >
                        📤
                      </SecondaryButton>
                      <SecondaryButton
                        onClick={() => handleViewContracts(property)}
                        title="View Contracts"
                        className="properties-mobile-action-btn"
                      >
                        👁️
                      </SecondaryButton>
                      <DangerButton
                        onClick={() => handleDeleteProperty(property.id)}
                        title="Delete Property"
                        className="properties-mobile-action-btn"
                      >
                        🗑️
                      </DangerButton>
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
    </>
  );
}

export default Properties;