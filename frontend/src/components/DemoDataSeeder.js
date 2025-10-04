import React, { useState } from 'react';
import apiService from '../services/api';

function DemoDataSeeder({ onDataSeeded, disabled }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSeedData = async () => {
    try {
      setLoading(true);
      setError(null);
      await apiService.seedDemoData();

      // Call onDataSeeded callback to trigger success message in parent
      if (onDataSeeded) {
        setTimeout(() => onDataSeeded(true), 200);
      }
    } catch (err) {
      setError(`Failed to seed demo data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ backgroundColor: '#f8f9fa', border: '2px dashed #dee2e6', textAlign: 'center' }}>
      <h3 style={{ color: '#495057', marginBottom: '15px' }}>🚀 Welcome to Rent Manager!</h3>
      <p style={{ color: '#6c757d', marginBottom: '20px' }}>
        Get started quickly by loading some sample data to explore all the features.
      </p>

      {error && (
        <div style={{
          color: '#dc3545',
          marginBottom: '15px',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          padding: '10px'
        }}>
          {error}
        </div>
      )}

      <button
        className="btn btn-primary"
        onClick={handleSeedData}
        disabled={loading || disabled}
        style={{
          marginBottom: '10px',
          opacity: (loading || disabled) ? 0.6 : 1
        }}
      >
        {loading ? 'Loading Demo Data...' : 'Load Demo Data'}
      </button>
      
      <p style={{ color: '#6c757d', fontSize: '14px', marginTop: '10px' }}>
        This will create sample properties, tenants, and payment records.
      </p>
    </div>
  );
}

export default DemoDataSeeder;