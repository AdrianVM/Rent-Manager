import React, { useState, useEffect } from 'react';
import authService from '../../services/authService';
import './DataSubjectRequestPage.css';

const DataSubjectRequestPage = () => {
  const token = authService.getToken();
  const [activeTab, setActiveTab] = useState('submit'); // submit, my-requests, preview
  const [requestType, setRequestType] = useState('');
  const [description, setDescription] = useState('');
  const [myRequests, setMyRequests] = useState([]);
  const [dataCategories, setDataCategories] = useState([]);
  const [deletionPreview, setDeletionPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const API_URL = process.env.REACT_APP_API_URL;

  const requestTypes = [
    {
      value: 'Access',
      label: 'Access My Data',
      description: 'Download a complete copy of all your personal data (GDPR Article 15)',
      icon: '📥'
    },
    {
      value: 'Deletion',
      label: 'Delete My Data',
      description: 'Request deletion of your personal data (GDPR Article 17 - Right to Erasure)',
      icon: '🗑️'
    },
    {
      value: 'Portability',
      label: 'Export My Data',
      description: 'Export your data in machine-readable format to transfer to another service (GDPR Article 20)',
      icon: '📤'
    },
    {
      value: 'Rectification',
      label: 'Correct My Data',
      description: 'Request correction of inaccurate personal data (GDPR Article 16)',
      icon: '✏️'
    },
    {
      value: 'Restriction',
      label: 'Restrict Processing',
      description: 'Request that we stop processing your data while maintaining it (GDPR Article 18)',
      icon: '⏸️'
    },
    {
      value: 'Objection',
      label: 'Object to Processing',
      description: 'Object to processing of your data for certain purposes (GDPR Article 21)',
      icon: '🛑'
    }
  ];

  useEffect(() => {
    if (activeTab === 'my-requests') {
      fetchMyRequests();
    } else if (activeTab === 'preview' && requestType === 'Access') {
      fetchDataCategories();
    } else if (activeTab === 'preview' && requestType === 'Deletion') {
      fetchDeletionPreview();
    }
  }, [activeTab, requestType]);

  const fetchMyRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/DataSubjectRequest/my-requests`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }

      const data = await response.json();
      setMyRequests(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDataCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/DataSubjectRequest/data-categories`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data categories');
      }

      const data = await response.json();
      setDataCategories(data.categories || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeletionPreview = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/DataSubjectRequest/deletion-preview`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch deletion preview');
      }

      const data = await response.json();
      setDeletionPreview(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();

    if (!requestType) {
      setError('Please select a request type');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_URL}/DataSubjectRequest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          requestType,
          description
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit request');
      }

      const data = await response.json();
      setSuccess(`Request submitted successfully! Request ID: ${data.id}. We will process your request within 30 days.`);
      setRequestType('');
      setDescription('');

      // Switch to my-requests tab to show the new request
      setTimeout(() => {
        setActiveTab('my-requests');
      }, 2000);
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Network error: Unable to connect to the server. Please check your connection and try again.');
      } else {
        setError(err.message || 'An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadExport = async (requestId) => {
    try {
      const response = await fetch(`${API_URL}/DataSubjectRequest/${requestId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to download export');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `data-export-${requestId}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending': return 'status-pending';
      case 'InProgress': return 'status-in-progress';
      case 'Completed': return 'status-completed';
      case 'Rejected': return 'status-rejected';
      default: return '';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if user is authenticated
  if (!token) {
    return (
      <div className="data-subject-request-page">
        <div className="page-header">
          <h1>Privacy & Data Requests</h1>
          <p>Exercise your data protection rights under GDPR</p>
        </div>
        <div className="error-message">
          <strong>Authentication Required</strong>
          <p>You must be logged in to submit data subject requests. Please log in and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="data-subject-request-page">
      <div className="page-header">
        <h1>Privacy & Data Requests</h1>
        <p>Exercise your data protection rights under GDPR</p>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'submit' ? 'active' : ''}`}
          onClick={() => setActiveTab('submit')}
        >
          Submit Request
        </button>
        <button
          className={`tab ${activeTab === 'my-requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-requests')}
        >
          My Requests
        </button>
        <button
          className={`tab ${activeTab === 'preview' ? 'active' : ''}`}
          onClick={() => setActiveTab('preview')}
          disabled={!requestType}
        >
          Preview Impact
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {activeTab === 'submit' && (
        <div className="submit-request-section">
          <h2>Submit a Data Subject Request</h2>
          <p className="section-description">
            Under GDPR, you have the right to access, correct, delete, or restrict the processing of your personal data.
            We will respond to your request within 30 days.
          </p>

          <form onSubmit={handleSubmitRequest} className="request-form">
            <div className="request-type-grid">
              {requestTypes.map((type) => (
                <div
                  key={type.value}
                  className={`request-type-card ${requestType === type.value ? 'selected' : ''}`}
                  onClick={() => setRequestType(type.value)}
                >
                  <div className="request-icon">{type.icon}</div>
                  <h3>{type.label}</h3>
                  <p>{type.description}</p>
                </div>
              ))}
            </div>

            {requestType && (
              <>
                <div className="form-group">
                  <label htmlFor="description">Additional Details (Optional)</label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide any additional context or specific details about your request..."
                    rows="4"
                  />
                </div>

                <div className="info-box">
                  <strong>What happens next?</strong>
                  <ul>
                    <li>Your request will be verified and reviewed by our team</li>
                    <li>You will receive email updates on the status of your request</li>
                    <li>We will complete your request within 30 days (GDPR requirement)</li>
                    {(requestType === 'Access' || requestType === 'Portability') && (
                      <li>Your data export will be available for download for 7 days</li>
                    )}
                    {requestType === 'Deletion' && (
                      <li>Some data may be retained for legal compliance (financial records: 7 years)</li>
                    )}
                  </ul>
                </div>

                <button type="submit" className="submit-button" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </>
            )}
          </form>
        </div>
      )}

      {activeTab === 'my-requests' && (
        <div className="my-requests-section">
          <h2>My Data Requests</h2>
          {loading ? (
            <p>Loading requests...</p>
          ) : myRequests.length === 0 ? (
            <div className="empty-state">
              <p>You haven't submitted any data requests yet.</p>
              <button onClick={() => setActiveTab('submit')} className="primary-button">
                Submit Your First Request
              </button>
            </div>
          ) : (
            <div className="requests-list">
              {myRequests.map((request) => (
                <div key={request.id} className="request-card">
                  <div className="request-header">
                    <div>
                      <h3>{request.requestType} Request</h3>
                      <span className={`status-badge ${getStatusBadgeClass(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                    <div className="request-id">#{request.id}</div>
                  </div>

                  <div className="request-details">
                    <div className="detail-row">
                      <span className="label">Submitted:</span>
                      <span>{formatDate(request.submittedAt)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Deadline:</span>
                      <span>{formatDate(request.deadlineAt)}</span>
                    </div>
                    {request.completedAt && (
                      <div className="detail-row">
                        <span className="label">Completed:</span>
                        <span>{formatDate(request.completedAt)}</span>
                      </div>
                    )}
                    {request.description && (
                      <div className="detail-row">
                        <span className="label">Description:</span>
                        <span>{request.description}</span>
                      </div>
                    )}
                  </div>

                  {request.status === 'Completed' &&
                   (request.requestType === 'Access' || request.requestType === 'Portability') &&
                   request.exportFilePath && (
                    <div className="request-actions">
                      <button
                        onClick={() => downloadExport(request.id)}
                        className="download-button"
                      >
                        📥 Download Export
                      </button>
                      {request.exportExpiresAt && (
                        <p className="expiry-note">
                          Expires: {formatDate(request.exportExpiresAt)}
                        </p>
                      )}
                    </div>
                  )}

                  {request.status === 'Completed' && request.requestType === 'Deletion' && (
                    <div className="deletion-summary">
                      <p><strong>Deletion Summary:</strong> {request.deletionSummary}</p>
                      <p><strong>Retained Data:</strong> {request.retentionSummary}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'preview' && (
        <div className="preview-section">
          <h2>Preview Impact</h2>

          {requestType === 'Access' && (
            <div className="data-categories">
              <h3>Data Categories We Hold</h3>
              {loading ? (
                <p>Loading...</p>
              ) : dataCategories.length === 0 ? (
                <p>No data categories found.</p>
              ) : (
                <ul className="categories-list">
                  {dataCategories.map((category, index) => (
                    <li key={index} className="category-item">
                      ✓ {category.replace(/_/g, ' ').toUpperCase()}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {requestType === 'Deletion' && deletionPreview && (
            <div className="deletion-preview">
              <div className="deletable-section">
                <h3>✓ Data That Will Be Deleted</h3>
                {Object.keys(deletionPreview.deletable).length === 0 ? (
                  <p>No data can be deleted at this time.</p>
                ) : (
                  <ul className="preview-list">
                    {Object.entries(deletionPreview.deletable).map(([key, value]) => (
                      <li key={key}>
                        <strong>{key.replace(/_/g, ' ')}:</strong> {value}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="retainable-section">
                <h3>⚠️ Data That Must Be Retained</h3>
                {Object.keys(deletionPreview.retainable).length === 0 ? (
                  <p>No data needs to be retained.</p>
                ) : (
                  <ul className="preview-list">
                    {Object.entries(deletionPreview.retainable).map(([key, value]) => (
                      <li key={key}>
                        <strong>{key.replace(/_/g, ' ')}:</strong> {value}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="warning-note">{deletionPreview.warning}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataSubjectRequestPage;
