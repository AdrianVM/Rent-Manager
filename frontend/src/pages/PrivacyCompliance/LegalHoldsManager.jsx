import React, { useState, useEffect } from 'react';
import dataRetentionService from '../../services/dataRetentionService';
import ConfirmModal from '../../components/common/ConfirmModal';
import AlertModal from '../../components/common/AlertModal';
import './LegalHoldsManager.css';

function LegalHoldsManager({ onUpdate }) {
  const [holds, setHolds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPlaceHoldForm, setShowPlaceHoldForm] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    dataCategory: '',
    reason: '',
    caseReference: '',
    notes: ''
  });

  // Modal states
  const [releaseModal, setReleaseModal] = useState({ isOpen: false, holdId: null, releaseReason: '' });
  const [alertModal, setAlertModal] = useState({ isOpen: false, type: 'info', title: '', message: '' });

  useEffect(() => {
    loadHolds();
  }, []);

  const loadHolds = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dataRetentionService.getActiveLegalHolds();
      setHolds(data);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error loading legal holds:', err);
      setError('Failed to load legal holds');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceHold = async (e) => {
    e.preventDefault();

    if (!formData.userId || !formData.reason) {
      setAlertModal({
        isOpen: true,
        type: 'warning',
        title: 'Missing Information',
        message: 'User ID and Reason are required fields'
      });
      return;
    }

    try {
      await dataRetentionService.placeLegalHold({
        userId: formData.userId,
        dataCategory: formData.dataCategory || null,
        reason: formData.reason,
        caseReference: formData.caseReference || null,
        notes: formData.notes || null
      });

      setAlertModal({
        isOpen: true,
        type: 'success',
        title: 'Success',
        message: 'Legal hold placed successfully'
      });
      setShowPlaceHoldForm(false);
      setFormData({
        userId: '',
        dataCategory: '',
        reason: '',
        caseReference: '',
        notes: ''
      });
      loadHolds();
    } catch (err) {
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to place legal hold: ' + err.message
      });
    }
  };

  const handleReleaseHold = (holdId) => {
    setReleaseModal({
      isOpen: true,
      holdId: holdId,
      releaseReason: ''
    });
  };

  const handleConfirmRelease = async () => {
    const { holdId, releaseReason } = releaseModal;

    if (!releaseReason.trim()) {
      setAlertModal({
        isOpen: true,
        type: 'warning',
        title: 'Missing Information',
        message: 'Release reason is required'
      });
      return;
    }

    setReleaseModal({ isOpen: false, holdId: null, releaseReason: '' });

    try {
      await dataRetentionService.releaseLegalHold(holdId, releaseReason);
      setAlertModal({
        isOpen: true,
        type: 'success',
        title: 'Success',
        message: 'Legal hold released successfully'
      });
      loadHolds();
    } catch (err) {
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to release legal hold: ' + err.message
      });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isDueForReview = (hold) => {
    if (!hold.reviewDate) return false;
    return new Date(hold.reviewDate) <= new Date();
  };

  if (loading) {
    return <div className="legal-holds-manager loading">Loading legal holds...</div>;
  }

  if (error) {
    return (
      <div className="legal-holds-manager error">
        <p>{error}</p>
        <button onClick={loadHolds} className="btn btn-secondary">Retry</button>
      </div>
    );
  }

  return (
    <div className="legal-holds-manager">
      <div className="manager-header">
        <div>
          <h2>⚖️ Legal Holds</h2>
          <p className="subtitle">
            Prevent data deletion during investigations or litigation
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowPlaceHoldForm(!showPlaceHoldForm)}
        >
          {showPlaceHoldForm ? '✕ Cancel' : '+ Place Legal Hold'}
        </button>
      </div>

      {showPlaceHoldForm && (
        <div className="place-hold-form">
          <h3>Place New Legal Hold</h3>
          <form onSubmit={handlePlaceHold}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="userId">User ID *</label>
                <input
                  type="text"
                  id="userId"
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  placeholder="e.g., user@example.com or user-id"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="dataCategory">Data Category (optional)</label>
                <input
                  type="text"
                  id="dataCategory"
                  value={formData.dataCategory}
                  onChange={(e) => setFormData({ ...formData, dataCategory: e.target.value })}
                  placeholder="Leave blank for all data"
                />
                <small>Leave blank to hold all user data, or specify a category</small>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="reason">Reason *</label>
                <textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="e.g., Active litigation - Case #12345"
                  rows="3"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="caseReference">Case Reference</label>
                <input
                  type="text"
                  id="caseReference"
                  value={formData.caseReference}
                  onChange={(e) => setFormData({ ...formData, caseReference: e.target.value })}
                  placeholder="e.g., CASE-2024-001"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Additional Notes</label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional information..."
                rows="2"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                ⚖️ Place Legal Hold
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowPlaceHoldForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {holds.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⚖️</div>
          <p>No active legal holds</p>
          <small>Legal holds prevent data deletion during investigations or litigation</small>
        </div>
      ) : (
        <div className="holds-grid">
          {holds.map((hold) => (
            <div
              key={hold.id}
              className={`hold-card ${isDueForReview(hold) ? 'due-review' : ''}`}
            >
              <div className="hold-header">
                <div className="hold-title">
                  <span className="hold-icon">⚖️</span>
                  <div>
                    <strong>{hold.userId}</strong>
                    {hold.dataCategory && (
                      <span className="data-category">{hold.dataCategory}</span>
                    )}
                    {!hold.dataCategory && (
                      <span className="data-category all">All Data</span>
                    )}
                  </div>
                </div>
                {isDueForReview(hold) && (
                  <span className="review-badge">⚠️ Review Due</span>
                )}
              </div>

              <div className="hold-details">
                <div className="detail-row">
                  <span className="detail-label">Reason:</span>
                  <span className="detail-value">{hold.reason}</span>
                </div>

                {hold.caseReference && (
                  <div className="detail-row">
                    <span className="detail-label">Case:</span>
                    <span className="detail-value case-ref">{hold.caseReference}</span>
                  </div>
                )}

                <div className="detail-row">
                  <span className="detail-label">Placed:</span>
                  <span className="detail-value">
                    {formatDate(hold.placedAt)} by {hold.placedBy}
                  </span>
                </div>

                {hold.reviewDate && (
                  <div className="detail-row">
                    <span className="detail-label">Review Date:</span>
                    <span className={`detail-value ${isDueForReview(hold) ? 'overdue' : ''}`}>
                      {formatDate(hold.reviewDate)}
                    </span>
                  </div>
                )}

                {hold.notes && (
                  <div className="detail-row notes">
                    <span className="detail-label">Notes:</span>
                    <span className="detail-value">{hold.notes}</span>
                  </div>
                )}
              </div>

              <div className="hold-actions">
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleReleaseHold(hold.id)}
                >
                  Release Hold
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="holds-info">
        <h3>ℹ️ About Legal Holds</h3>
        <ul>
          <li>
            <strong>Data under legal hold cannot be deleted</strong> - Even if the retention
            period expires, data will be preserved until the hold is released.
          </li>
          <li>
            <strong>Holds should be reviewed regularly</strong> - Each hold has a review
            date. Holds due for review are highlighted above.
          </li>
          <li>
            <strong>Document the reason</strong> - Always provide clear documentation for why
            the hold was placed and what case/investigation it relates to.
          </li>
          <li>
            <strong>Release when appropriate</strong> - Once an investigation or litigation is
            resolved, release the hold promptly to resume normal data management.
          </li>
        </ul>
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={releaseModal.isOpen}
        onConfirm={handleConfirmRelease}
        onCancel={() => setReleaseModal({ isOpen: false, holdId: null, releaseReason: '' })}
        title="Release Legal Hold"
        confirmText="Release Hold"
        cancelText="Cancel"
        confirmButtonStyle="danger"
      >
        <div>
          <p style={{ marginBottom: '12px' }}>Enter reason for releasing this legal hold:</p>
          <textarea
            value={releaseModal.releaseReason}
            onChange={(e) => setReleaseModal({ ...releaseModal, releaseReason: e.target.value })}
            placeholder="e.g., Case resolved, investigation complete..."
            rows="3"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '15px',
              fontFamily: 'inherit',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </ConfirmModal>

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ isOpen: false, type: 'info', title: '', message: '' })}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
      />
    </div>
  );
}

export default LegalHoldsManager;
