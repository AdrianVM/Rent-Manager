import React from 'react';

function TenantTypeSelector({ value, onChange }) {
  return (
    <div className="form-group">
      <label style={{ fontWeight: '600', marginBottom: '10px', display: 'block' }}>
        Tenant Type *
      </label>
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            padding: '10px 20px',
            border: `2px solid ${value === 'person' ? 'var(--primary-color)' : 'var(--border-color)'}`,
            borderRadius: '8px',
            backgroundColor: value === 'person' ? 'var(--primary-light, #e3f2fd)' : 'transparent',
            transition: 'all 0.2s'
          }}
        >
          <input
            type="radio"
            name="tenantType"
            value="person"
            checked={value === 'person'}
            onChange={(e) => onChange(e.target.value)}
            style={{ cursor: 'pointer' }}
          />
          <span style={{ fontWeight: value === 'person' ? '600' : 'normal' }}>
            👤 Person
          </span>
        </label>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            padding: '10px 20px',
            border: `2px solid ${value === 'company' ? 'var(--primary-color)' : 'var(--border-color)'}`,
            borderRadius: '8px',
            backgroundColor: value === 'company' ? 'var(--primary-light, #e3f2fd)' : 'transparent',
            transition: 'all 0.2s'
          }}
        >
          <input
            type="radio"
            name="tenantType"
            value="company"
            checked={value === 'company'}
            onChange={(e) => onChange(e.target.value)}
            style={{ cursor: 'pointer' }}
          />
          <span style={{ fontWeight: value === 'company' ? '600' : 'normal' }}>
            🏢 Company
          </span>
        </label>
      </div>
    </div>
  );
}

export default TenantTypeSelector;
