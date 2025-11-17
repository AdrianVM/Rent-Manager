import React, { useState, useEffect } from 'react';
import authService from '../../services/authService';
import './RetentionPolicyPage.css';

function RetentionPolicyPage() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [inquiry, setInquiry] = useState({
    subject: '',
    message: ''
  });
  const [submitStatus, setSubmitStatus] = useState(null);

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/dataretention/policies`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load retention policies');
      }

      const data = await response.json();
      setPolicies(data);
    } catch (err) {
      console.error('Error loading retention policies:', err);
      setError('Failed to load retention policies');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitInquiry = async (e) => {
    e.preventDefault();

    try {
      const token = authService.getToken();

      // Create a data subject request with type "RetentionInquiry"
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/DataSubjectRequest`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            requestType: 'RetentionInquiry',
            description: `Subject: ${inquiry.subject}\n\n${inquiry.message}`
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to submit inquiry');
      }

      setSubmitStatus('success');
      setInquiry({ subject: '', message: '' });
      setShowContactForm(false);

      setTimeout(() => setSubmitStatus(null), 5000);
    } catch (err) {
      console.error('Error submitting inquiry:', err);
      setSubmitStatus('error');
    }
  };

  if (loading) {
    return (
      <div className="retention-policy-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading retention policies...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="retention-policy-page">
        <div className="error-state">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
          <button onClick={loadPolicies} className="btn btn-secondary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="retention-policy-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>🗂️ Data Retention Policies</h1>
          <p className="subtitle">
            Learn how long we keep your data and why. If you have questions, you can contact us directly.
          </p>
        </div>
        <div className="header-actions">
          <button
            onClick={() => setShowContactForm(!showContactForm)}
            className="btn btn-primary"
          >
            {showContactForm ? 'Close Form' : '📧 Contact Us'}
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {submitStatus === 'success' && (
        <div className="alert alert-success">
          ✅ Your inquiry has been sent successfully. An admin will review it and respond soon.
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="alert alert-error">
          ❌ Failed to send inquiry. Please try again or contact support directly.
        </div>
      )}

      {/* Contact Form */}
      {showContactForm && (
        <div className="contact-form-section">
          <h2>Submit a Retention Inquiry</h2>
          <p className="form-description">
            Have questions about data retention? Submit your inquiry and an administrator will respond.
          </p>
          <form onSubmit={handleSubmitInquiry} className="contact-form">
            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <input
                type="text"
                id="subject"
                value={inquiry.subject}
                onChange={(e) => setInquiry({ ...inquiry, subject: e.target.value })}
                placeholder="e.g., Question about payment record retention"
                required
                maxLength={200}
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                value={inquiry.message}
                onChange={(e) => setInquiry({ ...inquiry, message: e.target.value })}
                placeholder="Please describe your question or concern about data retention..."
                required
                rows={6}
                maxLength={2000}
              ></textarea>
              <small>{inquiry.message.length}/2000 characters</small>
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setShowContactForm(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Send Inquiry
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Introduction */}
      <div className="policy-intro">
        <h2>📋 Why We Retain Data</h2>
        <p>
          We retain your personal data only for as long as necessary to fulfill the purposes for which it was collected,
          comply with legal obligations, or resolve disputes. Below are the specific retention periods for different types of data.
        </p>
      </div>

      {/* Policies List */}
      <div className="policies-grid">
        {policies.map((policy, index) => (
          <div key={index} className={`policy-card policy-${policy.action.toLowerCase()}`}>
            <div className="policy-header">
              <h3>{policy.dataCategory.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</h3>
              <span className={`action-badge action-${policy.action.toLowerCase()}`}>
                {getActionIcon(policy.action)} {policy.action}
              </span>
            </div>

            <div className="policy-body">
              <p className="policy-description">{policy.description}</p>

              <div className="policy-details">
                <div className="detail-row">
                  <span className="detail-label">⏱️ Retention Period:</span>
                  <span className="detail-value">{policy.retentionPeriodDescription}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">📜 Legal Basis:</span>
                  <span className="detail-value">{policy.legalBasis}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">🔄 What Happens:</span>
                  <span className="detail-value">{policy.actionDescription}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Information */}
      <div className="policy-footer">
        <h3>ℹ️ Additional Information</h3>
        <ul>
          <li>
            <strong>Manual Process:</strong> Data retention is managed manually by our administrators on a quarterly basis,
            ensuring careful review before any data is deleted or modified.
          </li>
          <li>
            <strong>Legal Holds:</strong> If data is subject to a legal hold (e.g., during litigation or investigation),
            it will be retained beyond the normal retention period until the hold is released.
          </li>
          <li>
            <strong>Your Rights:</strong> You can request access to, deletion of, or rectification of your personal data
            at any time through the Data Subject Rights page.
          </li>
          <li>
            <strong>Contact Us:</strong> If you have questions about these policies or want to request specific action,
            use the "Contact Us" button above to submit an inquiry.
          </li>
        </ul>
      </div>
    </div>
  );
}

function getActionIcon(action) {
  switch (action.toLowerCase()) {
    case 'delete':
      return '🗑️';
    case 'anonymize':
      return '🔒';
    case 'archive':
      return '📦';
    default:
      return '📝';
  }
}

export default RetentionPolicyPage;
