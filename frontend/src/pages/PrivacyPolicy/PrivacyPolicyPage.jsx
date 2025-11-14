import React, { useState, useEffect } from 'react';
import './PrivacyPolicyPage.css';

const PrivacyPolicyPage = () => {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
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

  if (loading) {
    return (
      <div className="privacy-policy-container">
        <div className="privacy-policy-loading">Loading privacy policy...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="privacy-policy-container">
        <div className="privacy-policy-error">
          <h2>Error Loading Privacy Policy</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="privacy-policy-container">
        <div className="privacy-policy-error">
          <h2>No Privacy Policy Available</h2>
          <p>The privacy policy is currently not available. Please check back later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="privacy-policy-container">
      <div className="privacy-policy-header">
        <h1>Privacy Policy</h1>
        <div className="privacy-policy-meta">
          <span className="policy-version">Version {policy.version}</span>
          <span className="policy-effective-date">
            Effective Date: {new Date(policy.effectiveDate).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="privacy-policy-content">
        <div
          className="policy-html-content"
          dangerouslySetInnerHTML={{ __html: policy.contentHtml }}
        />
      </div>

      <div className="privacy-policy-footer">
        <p>Last updated: {new Date(policy.createdAt).toLocaleDateString()}</p>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
