import React from 'react';

function PersonTenantForm({ data, onChange }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...data, [name]: value });
  };

  return (
    <div style={{
      padding: '20px',
      backgroundColor: 'var(--bg-secondary, #f8f9fa)',
      borderRadius: '8px',
      marginBottom: '20px'
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--text-primary)' }}>
        Personal Information
      </h3>

      <div className="form-row">
        <div className="form-group">
          <label>First Name *</label>
          <input
            type="text"
            name="firstName"
            value={data?.firstName || ''}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>
        <div className="form-group">
          <label>Last Name *</label>
          <input
            type="text"
            name="lastName"
            value={data?.lastName || ''}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Date of Birth</label>
          <input
            type="date"
            name="dateOfBirth"
            value={data?.dateOfBirth || ''}
            onChange={handleChange}
            className="form-control"
          />
        </div>
        <div className="form-group">
          <label>ID Number / SSN</label>
          <input
            type="text"
            name="idNumber"
            value={data?.idNumber || ''}
            onChange={handleChange}
            className="form-control"
            placeholder="XXX-XX-XXXX"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Nationality</label>
          <input
            type="text"
            name="nationality"
            value={data?.nationality || ''}
            onChange={handleChange}
            className="form-control"
          />
        </div>
        <div className="form-group">
          <label>Occupation</label>
          <input
            type="text"
            name="occupation"
            value={data?.occupation || ''}
            onChange={handleChange}
            className="form-control"
          />
        </div>
      </div>

      <h4 style={{ marginTop: '20px', marginBottom: '15px', color: 'var(--text-primary)' }}>
        Emergency Contact
      </h4>

      <div className="form-row">
        <div className="form-group">
          <label>Contact Name</label>
          <input
            type="text"
            name="emergencyContactName"
            value={data?.emergencyContactName || ''}
            onChange={handleChange}
            className="form-control"
          />
        </div>
        <div className="form-group">
          <label>Contact Phone</label>
          <input
            type="tel"
            name="emergencyContactPhone"
            value={data?.emergencyContactPhone || ''}
            onChange={handleChange}
            className="form-control"
          />
        </div>
      </div>

      <div className="form-group">
        <label>Relationship</label>
        <input
          type="text"
          name="emergencyContactRelation"
          value={data?.emergencyContactRelation || ''}
          onChange={handleChange}
          className="form-control"
          placeholder="e.g., Spouse, Parent, Sibling"
        />
      </div>
    </div>
  );
}

export default PersonTenantForm;
