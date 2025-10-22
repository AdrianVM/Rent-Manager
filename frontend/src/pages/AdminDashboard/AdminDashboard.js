import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import './AdminDashboard.css';

function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await apiService.getDashboardStats();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.');
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <h1>Dashboard Overview</h1>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h1>Dashboard Overview</h1>
        <p>{error}</p>
        <button className="btn-modern" onClick={loadDashboardData}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="admin-header">
        <div className="admin-header-content">
          <h1 className="admin-title">
            Dashboard Overview
          </h1>
          <p className="admin-subtitle">
            System-wide statistics and metrics
          </p>
        </div>
      </div>

      <div className="admin-content">
        {dashboardData && (
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Properties</h3>
              <div className="stat-number">{dashboardData.totalProperties}</div>
              <div className="stat-change positive">System-wide</div>
            </div>
            <div className="stat-card">
              <h3>Total Tenants</h3>
              <div className="stat-number">{dashboardData.totalTenants}</div>
              <div className="stat-change positive">All active</div>
            </div>
            <div className="stat-card">
              <h3>Monthly Revenue</h3>
              <div className="stat-number">${dashboardData.monthlyRevenue?.toLocaleString()}</div>
              <div className="stat-change positive">Current month</div>
            </div>
            <div className="stat-card">
              <h3>Occupancy Rate</h3>
              <div className="stat-number">{dashboardData.occupancyRate}%</div>
              <div className="stat-change positive">Overall system</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default AdminDashboard;
