import React from 'react';

function CompanyTenantForm({ data, onChange }) {
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
        Company Information
      </h3>

      <div className="form-group">
        <label>Company Name *</label>
        <input
          type="text"
          name="companyName"
          value={data?.companyName || ''}
          onChange={handleChange}
          className="form-control"
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Tax ID / EIN</label>
          <input
            type="text"
            name="taxId"
            value={data?.taxId || ''}
            onChange={handleChange}
            className="form-control"
            placeholder="XX-XXXXXXX"
          />
        </div>
        <div className="form-group">
          <label>Registration Number</label>
          <input
            type="text"
            name="registrationNumber"
            value={data?.registrationNumber || ''}
            onChange={handleChange}
            className="form-control"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Legal Form</label>
          <select
            name="legalForm"
            value={data?.legalForm || ''}
            onChange={handleChange}
            className="form-control"
          >
            <option value="">Select legal form</option>
            <option value="LLC">LLC</option>
            <option value="Corporation">Corporation</option>
            <option value="Partnership">Partnership</option>
            <option value="Sole Proprietorship">Sole Proprietorship</option>
            <option value="Non-Profit">Non-Profit</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="form-group">
          <label>Industry</label>
          <input
            type="text"
            name="industry"
            value={data?.industry || ''}
            onChange={handleChange}
            className="form-control"
            placeholder="e.g., Technology, Retail, Healthcare"
          />
        </div>
      </div>

      <h4 style={{ marginTop: '20px', marginBottom: '15px', color: 'var(--text-primary)' }}>
        Primary Contact Person
      </h4>

      <div className="form-group">
        <label>Contact Person Name</label>
        <input
          type="text"
          name="contactPersonName"
          value={data?.contactPersonName || ''}
          onChange={handleChange}
          className="form-control"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Title / Position</label>
          <input
            type="text"
            name="contactPersonTitle"
            value={data?.contactPersonTitle || ''}
            onChange={handleChange}
            className="form-control"
            placeholder="e.g., CFO, Office Manager"
          />
        </div>
        <div className="form-group">
          <label>Contact Email</label>
          <input
            type="email"
            name="contactPersonEmail"
            value={data?.contactPersonEmail || ''}
            onChange={handleChange}
            className="form-control"
          />
        </div>
      </div>

      <div className="form-group">
        <label>Contact Phone</label>
        <input
          type="tel"
          name="contactPersonPhone"
          value={data?.contactPersonPhone || ''}
          onChange={handleChange}
          className="form-control"
        />
      </div>

      <div className="form-group">
        <label>Billing Address</label>
        <textarea
          name="billingAddress"
          value={data?.billingAddress || ''}
          onChange={handleChange}
          className="form-control"
          rows="3"
          placeholder="If different from property address"
        />
      </div>
    </div>
  );
}

export default CompanyTenantForm;
