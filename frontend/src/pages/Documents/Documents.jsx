import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import { ContractViewer } from '../../components/common';
import './Documents.css';

function Documents() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedContract, setSelectedContract] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadTenantData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTenantData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user's tenant info - find the first active tenant
      const tenantsData = await apiService.getTenants();
      const tenant = tenantsData.find(t => t.status?.toLowerCase() === 'active');

      if (tenant) {
        await loadContracts(tenant.id);
      } else {
        setError('No active tenant account found. Please contact your property manager.');
      }
    } catch (err) {
      console.error('Error loading tenant data:', err);
      setError('Failed to load tenant information');
    } finally {
      setLoading(false);
    }
  };

  const loadContracts = async (tenantId) => {
    try {
      const data = await apiService.getContractsByTenant(tenantId);
      setContracts(data || []);
    } catch (err) {
      console.error('Error loading contracts:', err);
      setError('Failed to load documents');
    }
  };

  const handleViewContract = (contract) => {
    setSelectedContract(contract);
    setViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setViewerOpen(false);
    setSelectedContract(null);
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      Draft: { className: 'draft', icon: '📝' },
      Pending: { className: 'pending', icon: '⏳' },
      Signed: { className: 'signed', icon: '✅' },
      Terminated: { className: 'terminated', icon: '❌' }
    };

    const config = statusConfig[status] || statusConfig.Draft;

    return (
      <span className={`document-status-badge ${config.className}`}>
        {config.icon} {status}
      </span>
    );
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📕';
      case 'doc':
      case 'docx':
        return '📘';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return '🖼️';
      default:
        return '📄';
    }
  };

  const filteredContracts = contracts.filter(contract => {
    if (filterStatus === 'all') return true;
    return contract.status.toLowerCase() === filterStatus.toLowerCase();
  });

  const documentStats = {
    total: contracts.length,
    signed: contracts.filter(c => c.status === 'Signed').length,
    pending: contracts.filter(c => c.status === 'Pending').length,
    draft: contracts.filter(c => c.status === 'Draft').length,
  };

  if (loading) {
    return (
      <div className="documents-page">
        <div className="documents-header">
          <h1 className="documents-title">My Documents</h1>
        </div>
        <div className="documents-loading">
          <div className="loading-spinner"></div>
          <p>Loading your documents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="documents-page">
        <div className="documents-header">
          <h1 className="documents-title">My Documents</h1>
        </div>
        <div className="documents-error">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadTenantData}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="documents-page">
      <div className="documents-header">
        <div>
          <h1 className="documents-title">My Documents</h1>
          <p className="documents-subtitle">
            View and download your lease agreements and related documents
          </p>
        </div>
      </div>

      {/* Document Stats */}
      <div className="documents-stats">
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <div className="stat-value">{documentStats.total}</div>
            <div className="stat-label">Total Documents</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{documentStats.signed}</div>
            <div className="stat-label">Signed</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-value">{documentStats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <div className="stat-value">{documentStats.draft}</div>
            <div className="stat-label">Draft</div>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      {contracts.length > 0 && (
        <div className="documents-controls">
          <div className="filter-group">
            <label htmlFor="status-filter" className="filter-label">Filter by Status:</label>
            <select
              id="status-filter"
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Documents</option>
              <option value="signed">Signed</option>
              <option value="pending">Pending</option>
              <option value="draft">Draft</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>
        </div>
      )}

      {/* Documents List */}
      {filteredContracts.length === 0 ? (
        <div className="documents-empty">
          <div className="empty-icon">📄</div>
          <h3>No Documents Found</h3>
          {filterStatus === 'all' ? (
            <p>Contact your property manager if you need access to your lease documents</p>
          ) : (
            <p>No documents with status "{filterStatus}"</p>
          )}
        </div>
      ) : (
        <div className="documents-list">
          {filteredContracts.map(contract => (
            <div key={contract.id} className="document-card">
              <div className="document-icon">
                {getFileIcon(contract.fileName)}
              </div>
              <div className="document-content">
                <div className="document-header">
                  <h3 className="document-name">{contract.fileName}</h3>
                  {getStatusBadge(contract.status)}
                </div>

                <div className="document-meta">
                  <div className="document-meta-item">
                    <span className="meta-label">Uploaded:</span>
                    <span className="meta-value">
                      {new Date(contract.uploadedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  {contract.signedAt && (
                    <div className="document-meta-item">
                      <span className="meta-label">Signed:</span>
                      <span className="meta-value">
                        {new Date(contract.signedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}

                  {contract.fileSizeBytes && (
                    <div className="document-meta-item">
                      <span className="meta-label">Size:</span>
                      <span className="meta-value">
                        {(contract.fileSizeBytes / 1024).toFixed(2)} KB
                      </span>
                    </div>
                  )}
                </div>

                {contract.notes && (
                  <div className="document-notes">
                    <strong>Notes:</strong> {contract.notes}
                  </div>
                )}

                <div className="document-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleViewContract(contract)}
                  >
                    <span className="btn-icon">👁️</span>
                    View
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleDownload(contract)}
                  >
                    <span className="btn-icon">⬇️</span>
                    Download
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contract Viewer Modal */}
      {viewerOpen && selectedContract && (
        <ContractViewer
          contract={selectedContract}
          onClose={handleCloseViewer}
        />
      )}
    </div>
  );
}

export default Documents;
