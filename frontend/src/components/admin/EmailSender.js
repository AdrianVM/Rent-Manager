import React, { useState } from 'react';
import authService from '../../services/authService';
import './EmailSender.css';

function EmailSender() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [testEmail, setTestEmail] = useState('');

  const handleTestTemplate = async (templateType) => {
    if (!testEmail.trim()) {
      setError('Please enter a test email address');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = authService.getToken();
      const endpoint = templateType === 'all'
        ? `${process.env.REACT_APP_API_URL}/test-email/all`
        : `${process.env.REACT_APP_API_URL}/test-email/${templateType}`;

      console.log('Sending test email request to:', endpoint);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ RecipientEmail: testEmail })
      });

      console.log('Response status:', response.status);

      // Try to parse JSON, but handle cases where response might not be JSON
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        setError(`Server error: ${response.status} - ${text.substring(0, 100)}`);
        return;
      }

      console.log('Response data:', data);

      if (response.ok && data.success) {
        const templateName = templateType === 'all'
          ? 'All email templates'
          : templateType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        setSuccess(`${templateName} sent successfully to ${testEmail}!`);
      } else {
        setError(data.message || `Failed to send test email (${response.status}). Please try again.`);
      }
    } catch (err) {
      console.error('Error sending test email:', err);
      setError(`Failed to send test email: ${err.message || 'Please check your configuration.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="email-sender">
      <h2 className="email-sender-title">Email Testing</h2>
      <p className="email-sender-description">
        Test all email templates and verify their formatting.
      </p>

      {/* Email Template Testing Section */}
      <div className="test-email-section">
        <h3>Test Email Templates</h3>
        <p className="test-email-description">
          Send test emails with sample data to verify template formatting and styling.
        </p>
        <div className="test-email-form" style={{ marginBottom: '12px' }}>
          <input
            type="email"
            className="form-input"
            placeholder="your-email@example.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '12px' }}>
            <span className="alert-icon">⚠️</span>
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success" style={{ marginBottom: '12px' }}>
            <span className="alert-icon">✅</span>
            {success}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <button
            type="button"
            className="btn-test"
            onClick={() => handleTestTemplate('tenant-invitation')}
            disabled={isLoading || !testEmail.trim()}
            style={{ width: '100%' }}
          >
            📧 Tenant Invitation
          </button>
          <button
            type="button"
            className="btn-test"
            onClick={() => handleTestTemplate('payment-confirmation')}
            disabled={isLoading || !testEmail.trim()}
            style={{ width: '100%' }}
          >
            💳 Payment Confirmation
          </button>
          <button
            type="button"
            className="btn-test"
            onClick={() => handleTestTemplate('contract-upload')}
            disabled={isLoading || !testEmail.trim()}
            style={{ width: '100%' }}
          >
            📄 Contract Upload
          </button>
          <button
            type="button"
            className="btn-test"
            onClick={() => handleTestTemplate('welcome')}
            disabled={isLoading || !testEmail.trim()}
            style={{ width: '100%' }}
          >
            👋 Welcome Email
          </button>
          <button
            type="button"
            className="btn-test"
            onClick={() => handleTestTemplate('overdue-payment')}
            disabled={isLoading || !testEmail.trim()}
            style={{ width: '100%' }}
          >
            ⚠️ Overdue Payment
          </button>
          <button
            type="button"
            className="btn-test"
            onClick={() => handleTestTemplate('lease-expiration')}
            disabled={isLoading || !testEmail.trim()}
            style={{ width: '100%' }}
          >
            📅 Lease Expiration
          </button>
          <button
            type="button"
            className="btn-test"
            onClick={() => handleTestTemplate('rent-payment-reminder')}
            disabled={isLoading || !testEmail.trim()}
            style={{ width: '100%' }}
          >
            💰 Rent Reminder
          </button>
        </div>

        <div style={{ marginTop: '12px' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={() => handleTestTemplate('all')}
            disabled={isLoading || !testEmail.trim()}
            style={{ width: '100%', background: '#8b5cf6' }}
          >
            {isLoading ? 'Sending...' : '🚀 Send All Templates'}
          </button>
        </div>
      </div>

    </div>
  );
}

export default EmailSender;
