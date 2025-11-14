import React, { useState, useEffect } from 'react';
import './PrivacyPolicyModal.css';

const PrivacyPolicyModal = ({ onAccept, blocking = true }) => {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCurrentPolicy();
  }, []);

  const fetchCurrentPolicy = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5057/api';
      const response = await fetch(`${API_URL}/PrivacyPolicy/current`);

      if (!response.ok) {
        throw new Error('Failed to fetch privacy policy');
      }

      const data = await response.json();
      setPolicy(data);
    } catch (err) {
      console.error('Error fetching privacy policy:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!policy) return;

    setAccepting(true);
    setError(null);

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5057/api';
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/PrivacyPolicy/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          policyVersionId: policy.id,
          acceptanceMethod: 'modal'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to record acceptance');
      }

      if (onAccept) {
        onAccept();
      }
    } catch (err) {
      console.error('Error accepting privacy policy:', err);
      setError(err.message);
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="privacy-policy-modal-overlay">
        <div className="privacy-policy-modal">
          <div className="privacy-policy-modal-loading">
            Loading privacy policy...
          </div>
        </div>
      </div>
    );
  }

  if (error && !policy) {
    return (
      <div className="privacy-policy-modal-overlay">
        <div className="privacy-policy-modal">
          <div className="privacy-policy-modal-error">
            <h3>Error Loading Privacy Policy</h3>
            <p>{error}</p>
            <button onClick={fetchCurrentPolicy} className="btn-retry">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!policy) {
    return null;
  }

  return (
    <div className={`privacy-policy-modal-overlay ${blocking ? 'blocking' : ''}`}>
      <div className="privacy-policy-modal">
        <div className="privacy-policy-modal-header">
          <h2>Privacy Policy Update</h2>
          <div className="policy-version-badge">
            Version {policy.version}
          </div>
        </div>

        <div className="privacy-policy-modal-content">
          {policy.changesSummary && (
            <div className="changes-summary">
              <h3>What's Changed</h3>
              <p>{policy.changesSummary}</p>
            </div>
          )}

          <div className="policy-scroll-area">
            <div
              className="policy-html-content"
              dangerouslySetInnerHTML={{ __html: policy.contentHtml }}
            />
          </div>

          {error && (
            <div className="acceptance-error">
              {error}
            </div>
          )}
        </div>

        <div className="privacy-policy-modal-footer">
          <p className="acceptance-required-note">
            {blocking
              ? 'You must accept this privacy policy to continue using the application.'
              : 'Please review and accept the updated privacy policy.'}
          </p>
          <div className="modal-actions">
            {!blocking && (
              <button
                onClick={() => onAccept && onAccept()}
                className="btn-later"
                disabled={accepting}
              >
                I'll Review Later
              </button>
            )}
            <button
              onClick={handleAccept}
              className="btn-accept"
              disabled={accepting}
            >
              {accepting ? 'Accepting...' : 'I Accept'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyModal;
