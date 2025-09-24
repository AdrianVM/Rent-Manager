import React, { useState, useEffect } from 'react';
import apiService from '../services/api';


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
      <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
        <h1>Property Owner Dashboard</h1>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#dc3545' }}>
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
      <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ color: 'var(--primary-color)', marginBottom: '10px' }}>
            Property Owner Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
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
          <div className="stat-number" style={{ color: stats.vacantProperties > 0 ? '#ffc107' : '#28a745' }}>
            {stats.vacantProperties}
          </div>
          <div className="stat-label">Vacant Units</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: stats.overduePayments > 0 ? '#dc3545' : '#28a745' }}>
            {stats.overduePayments}
          </div>
          <div className="stat-label">Overdue Payments</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-number" style={{ fontSize: '1.5rem' }}>
            ${stats.monthlyRevenue.toLocaleString()}
          </div>
          <div className="stat-label">This Month's Revenue</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ fontSize: '1.5rem' }}>
            ${stats.expectedMonthlyRevenue.toLocaleString()}
          </div>
          <div className="stat-label">Expected Monthly Revenue</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ 
            fontSize: '1.5rem',
            color: parseFloat(stats.collectionRate) >= 100 ? '#28a745' : 
                   parseFloat(stats.collectionRate) >= 80 ? '#ffc107' : '#dc3545'
          }}>
            {stats.collectionRate}%
          </div>
          <div className="stat-label">Collection Rate</div>
        </div>
      </div>


      {(stats.totalProperties > 0 && stats.totalTenants === 0) && (
        <div className="card" style={{ backgroundColor: '#e3f2fd', border: '1px solid #2196f3' }}>
          <h3 style={{ color: '#1976d2', marginBottom: '15px' }}>Getting Started</h3>
          <p style={{ marginBottom: '15px', color: '#1565c0' }}>
            Great! You have properties set up. Now add tenants to start tracking rent payments.
          </p>
          <ol style={{ marginLeft: '20px', color: '#1565c0' }}>
            <li style={{ marginBottom: '8px' }}>
              ✅ Add your rental properties in the Properties section
            </li>
            <li style={{ marginBottom: '8px' }}>
              👤 Add tenants and assign them to properties
            </li>
            <li style={{ marginBottom: '8px' }}>
              💰 Start recording rent payments to track your revenue
            </li>
          </ol>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div className="card">
          <h3 style={{ marginBottom: '20px' }}>Outstanding Rent</h3>
          {dashboardData.outstandingRentItems.length === 0 ? (
            <p style={{ color: '#28a745', textAlign: 'center', padding: '20px' }}>
              All rent payments are up to date! 🎉
            </p>
          ) : (
            <div>
              {dashboardData.outstandingRentItems.map((item) => (
                <div
                  key={item.tenantId}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: '1px solid #eee',
                    backgroundColor: item.isOverdue ? '#fff5f5' : 'transparent',
                    marginLeft: item.isOverdue ? '-20px' : '0',
                    marginRight: item.isOverdue ? '-20px' : '0',
                    paddingLeft: item.isOverdue ? '20px' : '0',
                    paddingRight: item.isOverdue ? '20px' : '0'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '500' }}>
                      {item.tenantName}
                      {item.isOverdue && <span style={{ color: '#dc3545', marginLeft: '8px' }}>OVERDUE</span>}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      {item.propertyName}
                      {item.totalPaid > 0 && ` • $${item.totalPaid.toLocaleString()} paid`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontWeight: '500', 
                      color: item.isOverdue ? '#dc3545' : '#ffc107' 
                    }}>
                      ${item.amountDue.toLocaleString()} due
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <h3 style={{ marginBottom: '20px' }}>Recent Payments</h3>
          {dashboardData.recentPayments.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
              No payments recorded yet
            </p>
          ) : (
            <div>
              {dashboardData.recentPayments.map(payment => (
                <div
                  key={payment.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: '1px solid #eee'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '500' }}>{payment.tenantName}</div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      {payment.propertyName} • {new Date(payment.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '500', color: '#28a745' }}>
                      ${payment.amount.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', textTransform: 'capitalize' }}>
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