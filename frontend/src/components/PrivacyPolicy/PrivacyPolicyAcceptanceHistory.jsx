import React, { useState, useEffect } from 'react';
import './PrivacyPolicyAcceptanceHistory.css';

const PrivacyPolicyAcceptanceHistory = () => {
  const [acceptances, setAcceptances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAcceptanceHistory();
  }, []);

  const fetchAcceptanceHistory = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/PrivacyPolicy/my-acceptances`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch acceptance history');
      }

      const data = await response.json();
      setAcceptances(data);
    } catch (err) {
      console.error('Error fetching acceptance history:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="acceptance-history-container">
        <div className="acceptance-history-loading">Loading acceptance history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="acceptance-history-container">
        <div className="acceptance-history-error">
          <h3>Error Loading Acceptance History</h3>
          <p>{error}</p>
          <button onClick={fetchAcceptanceHistory} className="btn-retry">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="acceptance-history-container">
      <div className="acceptance-history-header">
        <h2>Privacy Policy Acceptance History</h2>
        <p className="history-description">
          View all privacy policy versions you have accepted and when you accepted them.
        </p>
      </div>

      {acceptances.length === 0 ? (
        <div className="no-acceptances">
          <p>You haven't accepted any privacy policies yet.</p>
        </div>
      ) : (
        <div className="acceptances-list">
          {acceptances.map((acceptance) => (
            <div key={acceptance.id} className="acceptance-card">
              <div className="acceptance-header">
                <div className="policy-version-info">
                  <span className="version-badge">
                    Version {acceptance.policyVersion?.version || 'Unknown'}
                  </span>
                  <span className="effective-date">
                    Effective: {acceptance.policyVersion?.effectiveDate
                      ? new Date(acceptance.policyVersion.effectiveDate).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>
                <span className="acceptance-date">
                  Accepted: {new Date(acceptance.acceptedAt).toLocaleString()}
                </span>
              </div>

              <div className="acceptance-details">
                <div className="detail-row">
                  <span className="detail-label">Acceptance Method:</span>
                  <span className="detail-value">
                    {acceptance.acceptanceMethod || 'N/A'}
                  </span>
                </div>

                {acceptance.ipAddress && (
                  <div className="detail-row">
                    <span className="detail-label">IP Address:</span>
                    <span className="detail-value">{acceptance.ipAddress}</span>
                  </div>
                )}

                {acceptance.userAgent && (
                  <div className="detail-row">
                    <span className="detail-label">User Agent:</span>
                    <span className="detail-value user-agent">
                      {acceptance.userAgent}
                    </span>
                  </div>
                )}

                {acceptance.wasShownChangesSummary && (
                  <div className="detail-row">
                    <span className="detail-label">Changes Summary:</span>
                    <span className="detail-value">Shown</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PrivacyPolicyAcceptanceHistory;
