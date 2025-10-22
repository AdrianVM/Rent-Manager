import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import './PropertyOwnerDashboard.css';


function PropertyOwnerDashboard() {
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
      <div className="po-dashboard-loading">
        <h1>Property Owner Dashboard</h1>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="po-dashboard-error">
        <h1>Property Owner Dashboard</h1>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={loadDashboardData}>
          Try Again
        </button>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="po-dashboard-no-data">
        <h1>Property Owner Dashboard</h1>
        <p>No data available.</p>
      </div>
    );
  }

  const stats = {
    totalProperties: dashboardData.totalProperties,
    totalTenants: dashboardData.activeTenants,
    vacantProperties: dashboardData.totalProperties - dashboardData.activeTenants,
    monthlyRevenue: dashboardData.monthlyCollected,
    expectedMonthlyRevenue: dashboardData.totalMonthlyRent,
    collectionRate: dashboardData.totalMonthlyRent > 0 
      ? ((dashboardData.monthlyCollected / dashboardData.totalMonthlyRent) * 100).toFixed(1)
      : '0.0',
    overduePayments: dashboardData.outstandingRentItems.filter(item => item.isOverdue).length
  };

  return (
    <div>
      <div className="po-dashboard-header">
        <div>
          <h1 className="po-dashboard-title">
            Property Owner Dashboard
          </h1>
          <p className="po-dashboard-subtitle">
            Manage your properties, tenants, and revenue
          </p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.totalProperties}</div>
          <div className="stat-label">Total Properties</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.totalTenants}</div>
          <div className="stat-label">Active Tenants</div>
        </div>
        <div className="stat-card">
          <div className={`stat-number ${stats.vacantProperties > 0 ? 'stat-number-warning' : 'stat-number-success'}`}>
            {stats.vacantProperties}
          </div>
          <div className="stat-label">Vacant Units</div>
        </div>
        <div className="stat-card">
          <div className={`stat-number ${stats.overduePayments > 0 ? 'stat-number-danger' : 'stat-number-success'}`}>
            {stats.overduePayments}
          </div>
          <div className="stat-label">Overdue Payments</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-number stat-number-large">
            ${stats.monthlyRevenue.toLocaleString()}
          </div>
          <div className="stat-label">This Month's Revenue</div>
        </div>
        <div className="stat-card">
          <div className="stat-number stat-number-large">
            ${stats.expectedMonthlyRevenue.toLocaleString()}
          </div>
          <div className="stat-label">Expected Monthly Revenue</div>
        </div>
        <div className="stat-card">
          <div className={`stat-number stat-number-large ${
            parseFloat(stats.collectionRate) >= 100 ? 'stat-number-success' :
            parseFloat(stats.collectionRate) >= 80 ? 'stat-number-warning' : 'stat-number-danger'
          }`}>
            {stats.collectionRate}%
          </div>
          <div className="stat-label">Collection Rate</div>
        </div>
      </div>


      {(stats.totalProperties > 0 && stats.totalTenants === 0) && (
        <div className="card po-getting-started-card">
          <h3 className="po-getting-started-title">Getting Started</h3>
          <p className="po-getting-started-text">
            Great! You have properties set up. Now add tenants to start tracking rent payments.
          </p>
          <ol className="po-getting-started-list">
            <li className="po-getting-started-list-item">
              ✅ Add your rental properties in the Properties section
            </li>
            <li className="po-getting-started-list-item">
              👤 Add tenants and assign them to properties
            </li>
            <li className="po-getting-started-list-item">
              💰 Start recording rent payments to track your revenue
            </li>
          </ol>
        </div>
      )}

      <div className="po-dashboard-grid">
        <div className="card">
          <h3 className="po-section-title">Outstanding Rent</h3>
          {dashboardData.outstandingRentItems.length === 0 ? (
            <p className="po-outstanding-all-paid">
              All rent payments are up to date! 🎉
            </p>
          ) : (
            <div>
              {dashboardData.outstandingRentItems.map((item) => (
                <div
                  key={item.tenantId}
                  className={`po-outstanding-item ${item.isOverdue ? 'overdue' : ''}`}
                >
                  <div>
                    <div className="po-outstanding-tenant-name">
                      {item.tenantName}
                      {item.isOverdue && <span className="po-outstanding-overdue-badge">OVERDUE</span>}
                    </div>
                    <div className="po-outstanding-property-info">
                      {item.propertyName}
                      {item.totalPaid > 0 && ` • $${item.totalPaid.toLocaleString()} paid`}
                    </div>
                  </div>
                  <div>
                    <div className={`po-outstanding-amount ${item.isOverdue ? 'overdue' : 'pending'}`}>
                      ${item.amountDue.toLocaleString()} due
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <h3 className="po-section-title">Recent Payments</h3>
          {dashboardData.recentPayments.length === 0 ? (
            <p className="po-recent-payments-empty">
              No payments recorded yet
            </p>
          ) : (
            <div>
              {dashboardData.recentPayments.map(payment => (
                <div
                  key={payment.id}
                  className="po-recent-payment-item"
                >
                  <div>
                    <div className="po-payment-tenant-name">{payment.tenantName}</div>
                    <div className="po-payment-property-info">
                      {payment.propertyName} • {new Date(payment.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="po-payment-amount">
                      ${payment.amount.toLocaleString()}
                    </div>
                    <div className="po-payment-status">
                      {payment.status.toLowerCase()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PropertyOwnerDashboard;