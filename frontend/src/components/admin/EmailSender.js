import React, { useState } from 'react';
import authService from '../../services/authService';
import './EmailSender.css';

function EmailSender() {
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    body: '',
    isHtml: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [testEmail, setTestEmail] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
    setSuccess('');
  };

  const handleTestEmailSend = async () => {
    if (!testEmail.trim()) {
      setError('Please enter a test email address');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = authService.getToken();
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/admin/email/test`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ testEmail })
        }
      );

      // Check if response has content
      const text = await response.text();
      let data = null;

      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        setError('Failed to send test email. Please try again.');
        return;
      }

      if (response.ok && data.success) {
        setSuccess(`Test email sent successfully to ${testEmail}!`);
        setTestEmail('');
      } else {
        const errorMsg = data.errorMessage || 'Failed to send test email. Please try again.';
        setError(errorMsg);
      }
    } catch (err) {
      setError('Failed to send test email. Please check your email configuration.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.to.trim() || !formData.subject.trim() || !formData.body.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = authService.getToken();
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/admin/email/send`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        }
      );

      // Check if response has content
      const text = await response.text();
      let data = null;

      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        setError('Failed to send email. Please try again.');
        return;
      }

      if (response.ok && data.success) {
        setSuccess(`Email sent successfully to ${formData.to}!`);
        // Reset form
        setFormData({
          to: '',
          subject: '',
          body: '',
          isHtml: true
        });
      } else {
        const errorMsg = data.errorMessage || 'Failed to send email. Please try again.';
        setError(errorMsg);
      }
    } catch (err) {
      setError('Failed to send email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="email-sender">
      <h2 className="email-sender-title">Send Email</h2>
      <p className="email-sender-description">
        Send emails to users through the configured email service.
      </p>

      {/* Test Email Section */}
      <div className="test-email-section">
        <h3>Test Email Configuration</h3>
        <p className="test-email-description">
          Send a test email to verify your email service is configured correctly.
        </p>
        <div className="test-email-form">
          <input
            type="email"
            className="form-input"
            placeholder="your-email@example.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="button"
            className="btn-test"
            onClick={handleTestEmailSend}
            disabled={isLoading || !testEmail.trim()}
          >
            {isLoading ? 'Sending...' : 'Send Test Email'}
          </button>
        </div>
      </div>

      <hr className="section-divider" />

      {/* Email Form */}
      <form onSubmit={handleSubmit} className="email-form">
        <div className="form-group">
          <label htmlFor="to" className="form-label">
            Recipient Email <span className="required">*</span>
          </label>
          <input
            type="email"
            id="to"
            name="to"
            className="form-input"
            placeholder="recipient@example.com"
            value={formData.to}
            onChange={handleChange}
            disabled={isLoading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="subject" className="form-label">
            Subject <span className="required">*</span>
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            className="form-input"
            placeholder="Email subject"
            value={formData.subject}
            onChange={handleChange}
            disabled={isLoading}
            maxLength={200}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="body" className="form-label">
            Message <span className="required">*</span>
          </label>
          <textarea
            id="body"
            name="body"
            className="form-textarea"
            placeholder={formData.isHtml ? 'Enter HTML or plain text message...' : 'Enter your message...'}
            value={formData.body}
            onChange={handleChange}
            disabled={isLoading}
            rows={10}
            required
          />
        </div>

        <div className="form-group-checkbox">
          <input
            type="checkbox"
            id="isHtml"
            name="isHtml"
            checked={formData.isHtml}
            onChange={handleChange}
            disabled={isLoading}
          />
          <label htmlFor="isHtml" className="checkbox-label">
            Send as HTML email
          </label>
        </div>

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <span className="alert-icon">✅</span>
            {success}
          </div>
        )}

        <button
          type="submit"
          className="btn-primary"
          disabled={isLoading || !formData.to || !formData.subject || !formData.body}
        >
          {isLoading ? 'Sending...' : 'Send Email'}
        </button>
      </form>
    </div>
  );
}

export default EmailSender;
