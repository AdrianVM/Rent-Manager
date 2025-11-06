import React, { useState, useEffect } from 'react';
import { PrimaryButton, SecondaryButton, DangerButton, ContractViewer } from '../../../components/common';
import apiService from '../../../services/api';

// Contract Upload Modal Component
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

// Main PropertyContracts Component
const PropertyContracts = ({ property, contracts, onUpdate }) => {
  const [tenants, setTenants] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewingContract, setViewingContract] = useState(null);

  useEffect(() => {
    loadTenants();
  }, []);

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

  const handleUploadClick = () => {
    setShowUploadModal(true);
  };

  const handleUploadClose = () => {
    setShowUploadModal(false);
  };

  const handleUploadComplete = () => {
    setShowUploadModal(false);
    onUpdate(); // Trigger parent to reload contracts
  };

  const handleView = (contract) => {
    setViewingContract(contract);
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
        onUpdate(); // Trigger parent to reload contracts
      } catch (err) {
        alert('Failed to delete contract');
        console.error('Error deleting contract:', err);
      }
    }
  };

  return (
    <>
      <div className="property-view-section">
        <div className="property-view-card">
          <div className="property-contracts-header">
            <h2 className="property-view-section-title">
              Contracts
              {contracts.length > 0 && (
                <span className="contracts-count-badge">{contracts.length}</span>
              )}
            </h2>
            <PrimaryButton onClick={handleUploadClick}>
              📤 Upload New Contract
            </PrimaryButton>
          </div>

          {contracts.length === 0 ? (
            <div className="property-contracts-empty">
              <div className="property-contracts-empty-icon">📄</div>
              <p className="property-contracts-empty-text">
                No contracts uploaded for this property
              </p>
              <SecondaryButton onClick={handleUploadClick}>
                Upload Your First Contract
              </SecondaryButton>
            </div>
          ) : (
            <div className="property-contracts-list">
              {contracts.map(contract => (
                <div key={contract.id} className="property-contract-item">
                  <div className="property-contract-header">
                    <div className="property-contract-info">
                      <h4 className="property-contract-title" title={contract.fileName}>
                        <span className="property-contract-filename">{contract.fileName}</span>
                      </h4>
                      <div className="property-contract-tenant">
                        Tenant: {getTenantName(contract.tenantId)}
                      </div>
                    </div>
                    {getStatusBadge(contract.status)}
                  </div>
                  {contract.notes && (
                    <div className="property-contract-notes">
                      Notes: {contract.notes}
                    </div>
                  )}
                  <div className="property-contract-footer">
                    <span className="property-contract-meta">
                      Uploaded: {new Date(contract.uploadedAt).toLocaleDateString()}
                      {contract.signedAt && ` • Signed: ${new Date(contract.signedAt).toLocaleDateString()}`}
                    </span>
                    <div className="property-contract-actions">
                      <SecondaryButton
                        className="property-contract-action-btn"
                        onClick={() => handleView(contract)}
                        title="View Contract"
                      >
                        👁️
                      </SecondaryButton>
                      <PrimaryButton
                        className="property-contract-action-btn"
                        onClick={() => handleDownload(contract)}
                        title="Download Contract"
                      >
                        ⬇️
                      </PrimaryButton>
                      <DangerButton
                        className="property-contract-action-btn"
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
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <ContractUpload
          property={property}
          tenants={tenants}
          onClose={handleUploadClose}
          onUpload={handleUploadComplete}
        />
      )}

      {/* Contract Viewer Modal */}
      {viewingContract && (
        <ContractViewer
          contract={viewingContract}
          onClose={() => setViewingContract(null)}
        />
      )}
    </>
  );
};

export default PropertyContracts;
