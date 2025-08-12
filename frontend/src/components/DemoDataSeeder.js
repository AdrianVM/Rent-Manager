import React, { useState } from 'react';
import apiService from '../services/api';

function DemoDataSeeder({ onDataSeeded }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSeedData = async () => {
    try {
      setLoading(true);
      setError(null);
      await apiService.seedDemoData();
      if (onDataSeeded) {
        onDataSeeded();
      }
    } catch (err) {
      setError('Failed to seed demo data. Please try again.');
      console.error('Error seeding demo data:', err);
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
        <p style={{ color: '#dc3545', marginBottom: '15px' }}>
          {error}
        </p>
      )}
      
      <button 
        className="btn btn-primary" 
        onClick={handleSeedData}
        disabled={loading}
        style={{ marginBottom: '10px' }}
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