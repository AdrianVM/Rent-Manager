import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import WizardStepper from '../components/common/WizardStepper';
import { PrimaryButton, SecondaryButton } from '../components/common';

const API_BASE_URL = process.env.REACT_APP_API_URL;

function TenantOnboarding() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [currentStep, setCurrentStep] = useState(0);
  const [invitation, setInvitation] = useState(null);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    numberOfOccupants: '',
    hasPets: false,
    petDetails: '',
    agreeToTerms: false
  });

  const steps = ['Verify Invitation', 'Personal Info', 'Emergency Contact', 'Additional Info', 'Review & Submit'];

  const loadInvitationData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/tenantinvitations/token/${token}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load invitation');
      }

      const invitationData = await response.json();
      setInvitation(invitationData);
      setFormData(prev => ({ ...prev, email: invitationData.email }));

      // Load property details
      const propResponse = await fetch(`${API_BASE_URL}/tenantonboarding/property/${invitationData.propertyId}`);
      if (propResponse.ok) {
        const propData = await propResponse.json();
        setProperty(propData);
      }

      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    loadInvitationData();
  }, [token, loadInvitationData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1: // Personal Info
        if (!formData.name || !formData.email || !formData.password) {
          alert('Please fill in all required fields');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          alert('Passwords do not match');
          return false;
        }
        if (formData.password.length < 6) {
          alert('Password must be at least 6 characters');
          return false;
        }
        return true;
      case 4: // Review
        if (!formData.agreeToTerms) {
          alert('You must agree to the terms and conditions');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    try {
      setSubmitting(true);
      const response = await fetch(`${API_BASE_URL}/tenantonboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationToken: token,
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          password: formData.password,
          emergencyContactName: formData.emergencyContactName || null,
          emergencyContactPhone: formData.emergencyContactPhone || null,
          numberOfOccupants: formData.numberOfOccupants ? parseInt(formData.numberOfOccupants) : null,
          hasPets: formData.hasPets,
          petDetails: formData.petDetails || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to complete onboarding');
      }

      await response.json();
      alert('Welcome! Your account has been created successfully. Please login with your credentials.');
      navigate('/');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="card" style={{ maxWidth: '500px', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--error-color)', marginBottom: '15px' }}>⚠️ Invitation Error</h2>
          <p>{error}</p>
          <PrimaryButton onClick={() => navigate('/')} style={{ marginTop: '20px' }}>
            Go to Login
          </PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '20px', backgroundColor: 'var(--bg-secondary)' }}>
      <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="card" style={{ marginTop: '20px' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '10px', color: 'var(--primary-color)' }}>
            Welcome to Your New Home! 🏠
          </h1>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '30px' }}>
            Complete your tenant onboarding in just a few steps
          </p>

          <WizardStepper steps={steps} currentStep={currentStep} />

          {/* Step 0: Verify Invitation */}
          {currentStep === 0 && invitation && (
            <div>
              <h3>Invitation Details</h3>
              {property && (
                <div style={{ marginTop: '20px', padding: '20px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                  <h4 style={{ marginTop: 0 }}>Property Information</h4>
                  <p><strong>Property:</strong> {property.name}</p>
                  <p><strong>Address:</strong> {property.address}</p>
                  <p><strong>Type:</strong> {property.type}</p>
                  {property.bedrooms && <p><strong>Bedrooms:</strong> {property.bedrooms}</p>}
                  {property.bathrooms && <p><strong>Bathrooms:</strong> {property.bathrooms}</p>}
                </div>
              )}
              <div style={{ marginTop: '20px', padding: '20px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <h4 style={{ marginTop: 0 }}>Lease Details</h4>
                <p><strong>Email:</strong> {invitation.email}</p>
                {invitation.rentAmount && <p><strong>Monthly Rent:</strong> ${invitation.rentAmount.toLocaleString()}</p>}
                {invitation.deposit && <p><strong>Security Deposit:</strong> ${invitation.deposit.toLocaleString()}</p>}
                {invitation.leaseStart && <p><strong>Lease Start:</strong> {new Date(invitation.leaseStart).toLocaleDateString()}</p>}
                {invitation.leaseEnd && <p><strong>Lease End:</strong> {new Date(invitation.leaseEnd).toLocaleDateString()}</p>}
              </div>
            </div>
          )}

          {/* Step 1: Personal Info */}
          {currentStep === 1 && (
            <div>
              <h3>Personal Information</h3>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  value={formData.email}
                  onChange={handleInputChange}
                  readOnly
                  style={{ backgroundColor: '#f5f5f5' }}
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-control"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  name="password"
                  className="form-control"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  className="form-control"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          )}

          {/* Step 2: Emergency Contact */}
          {currentStep === 2 && (
            <div>
              <h3>Emergency Contact</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Please provide an emergency contact (optional but recommended)
              </p>
              <div className="form-group">
                <label>Emergency Contact Name</label>
                <input
                  type="text"
                  name="emergencyContactName"
                  className="form-control"
                  value={formData.emergencyContactName}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Emergency Contact Phone</label>
                <input
                  type="tel"
                  name="emergencyContactPhone"
                  className="form-control"
                  value={formData.emergencyContactPhone}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          )}

          {/* Step 3: Additional Info */}
          {currentStep === 3 && (
            <div>
              <h3>Additional Information</h3>
              <div className="form-group">
                <label>Number of Occupants</label>
                <input
                  type="number"
                  name="numberOfOccupants"
                  className="form-control"
                  value={formData.numberOfOccupants}
                  onChange={handleInputChange}
                  min="1"
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="hasPets"
                    checked={formData.hasPets}
                    onChange={handleInputChange}
                    style={{ marginRight: '10px' }}
                  />
                  Do you have pets?
                </label>
              </div>
              {formData.hasPets && (
                <div className="form-group">
                  <label>Pet Details</label>
                  <textarea
                    name="petDetails"
                    className="form-control"
                    value={formData.petDetails}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Please describe your pets (type, breed, weight, etc.)"
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 4: Review & Submit */}
          {currentStep === 4 && (
            <div>
              <h3>Review Your Information</h3>
              <div style={{ marginTop: '20px', padding: '20px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <h4 style={{ marginTop: 0 }}>Personal Information</h4>
                <p><strong>Name:</strong> {formData.name}</p>
                <p><strong>Email:</strong> {formData.email}</p>
                {formData.phone && <p><strong>Phone:</strong> {formData.phone}</p>}
              </div>
              {(formData.emergencyContactName || formData.emergencyContactPhone) && (
                <div style={{ marginTop: '15px', padding: '20px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                  <h4 style={{ marginTop: 0 }}>Emergency Contact</h4>
                  {formData.emergencyContactName && <p><strong>Name:</strong> {formData.emergencyContactName}</p>}
                  {formData.emergencyContactPhone && <p><strong>Phone:</strong> {formData.emergencyContactPhone}</p>}
                </div>
              )}
              <div style={{ marginTop: '15px', padding: '20px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <h4 style={{ marginTop: 0 }}>Additional Information</h4>
                {formData.numberOfOccupants && <p><strong>Number of Occupants:</strong> {formData.numberOfOccupants}</p>}
                <p><strong>Pets:</strong> {formData.hasPets ? 'Yes' : 'No'}</p>
                {formData.hasPets && formData.petDetails && <p><strong>Pet Details:</strong> {formData.petDetails}</p>}
              </div>
              <div className="form-group" style={{ marginTop: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleInputChange}
                    style={{ marginRight: '10px', marginTop: '3px' }}
                    required
                  />
                  <span>
                    I agree to the terms and conditions and confirm that all information provided is accurate *
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '30px',
            paddingTop: '20px',
            borderTop: '1px solid #e0e0e0'
          }}>
            <SecondaryButton
              onClick={handleBack}
              disabled={currentStep === 0}
              style={{ visibility: currentStep === 0 ? 'hidden' : 'visible' }}
            >
              ← Back
            </SecondaryButton>
            {currentStep < steps.length - 1 ? (
              <PrimaryButton onClick={handleNext}>
                Next →
              </PrimaryButton>
            ) : (
              <PrimaryButton
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Complete Onboarding ✓'}
              </PrimaryButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TenantOnboarding;
