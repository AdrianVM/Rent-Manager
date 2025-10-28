import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import './PaymentHistory.css';

function PaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('all');

  useEffect(() => {
    loadPaymentData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPaymentData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user's tenant info - find the first active tenant
      const tenantsData = await apiService.getTenants();
      const tenant = tenantsData.find(t => t.status?.toLowerCase() === 'active');

      if (tenant) {
        // Get all payments and filter for current tenant
        const paymentsData = await apiService.getPayments();
        const tenantPayments = paymentsData
          .filter(payment => payment.tenantId === tenant.id)
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        setPayments(tenantPayments);
      } else {
        setError('No active tenant account found. Please contact your property manager.');
      }
    } catch (err) {
      console.error('Error loading payment data:', err);
      setError('Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { className: 'completed', icon: '✅', label: 'Completed' },
      pending: { className: 'pending', icon: '⏳', label: 'Pending' },
      failed: { className: 'failed', icon: '❌', label: 'Failed' },
      cancelled: { className: 'cancelled', icon: '🚫', label: 'Cancelled' }
    };

    const config = statusConfig[status.toLowerCase()] || statusConfig.pending;

    return (
      <span className={`payment-status-badge ${config.className}`}>
        {config.icon} {config.label}
      </span>
    );
  };

  const getPaymentMethodIcon = (method) => {
    const methodConfig = {
      creditcard: '💳',
      debitcard: '💳',
      banktransfer: '🏦',
      cash: '💵',
      check: '📝',
      online: '🌐'
    };
    return methodConfig[method?.toLowerCase().replace(/[_\s]/g, '')] || '💰';
  };

  const formatPaymentMethod = (method) => {
    return method
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^\w/, c => c.toUpperCase())
      .trim();
  };

  const filterPaymentsByPeriod = (payments, period) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const threeMonthsAgo = new Date(now.setMonth(now.getMonth() - 3));

    return payments.filter(payment => {
      const paymentDate = new Date(payment.date);

      switch (period) {
        case 'month':
          return paymentDate >= startOfMonth;
        case 'quarter':
          return paymentDate >= threeMonthsAgo;
        case 'year':
          return paymentDate >= startOfYear;
        case 'all':
        default:
          return true;
      }
    });
  };

  const filteredPayments = payments.filter(payment => {
    // Filter by status
    if (filterStatus !== 'all' && payment.status.toLowerCase() !== filterStatus.toLowerCase()) {
      return false;
    }
    return true;
  });

  const periodFilteredPayments = filterPaymentsByPeriod(filteredPayments, filterPeriod);

  const paymentStats = {
    total: payments.filter(p => p.status.toLowerCase() === 'completed').reduce((sum, p) => sum + p.amount, 0),
    count: payments.filter(p => p.status.toLowerCase() === 'completed').length,
    pending: payments.filter(p => p.status.toLowerCase() === 'pending').reduce((sum, p) => sum + p.amount, 0),
    average: payments.filter(p => p.status.toLowerCase() === 'completed').length > 0
      ? payments.filter(p => p.status.toLowerCase() === 'completed').reduce((sum, p) => sum + p.amount, 0) /
        payments.filter(p => p.status.toLowerCase() === 'completed').length
      : 0
  };

  if (loading) {
    return (
      <div className="payment-history-page">
        <div className="payment-history-header">
          <h1 className="payment-history-title">Payment History</h1>
        </div>
        <div className="payment-history-loading">
          <div className="loading-spinner"></div>
          <p>Loading your payment history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-history-page">
        <div className="payment-history-header">
          <h1 className="payment-history-title">Payment History</h1>
        </div>
        <div className="payment-history-error">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadPaymentData}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-history-page">
      <div className="payment-history-header">
        <div>
          <h1 className="payment-history-title">Payment History</h1>
          <p className="payment-history-subtitle">
            View your complete rent payment history and transaction details
          </p>
        </div>
      </div>

      {/* Payment Stats */}
      <div className="payment-stats">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">${paymentStats.total.toLocaleString()}</div>
            <div className="stat-label">Total Paid</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{paymentStats.count}</div>
            <div className="stat-label">Payments Made</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-value">${paymentStats.average.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            <div className="stat-label">Average Payment</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-value">${paymentStats.pending.toLocaleString()}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      {payments.length > 0 && (
        <div className="payment-controls">
          <div className="filter-group">
            <label htmlFor="status-filter" className="filter-label">Status:</label>
            <select
              id="status-filter"
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Payments</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="period-filter" className="filter-label">Period:</label>
            <select
              id="period-filter"
              className="filter-select"
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="month">This Month</option>
              <option value="quarter">Last 3 Months</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
      )}

      {/* Payments List */}
      {periodFilteredPayments.length === 0 ? (
        <div className="payment-empty">
          <div className="empty-icon">💳</div>
          <h3>No Payments Found</h3>
          {filterStatus === 'all' && filterPeriod === 'all' ? (
            <p>You don't have any payment history yet</p>
          ) : (
            <p>No payments match your selected filters</p>
          )}
        </div>
      ) : (
        <div className="payment-list">
          {periodFilteredPayments.map(payment => (
            <div key={payment.id} className="payment-card">
              <div className="payment-icon">
                {getPaymentMethodIcon(payment.method)}
              </div>
              <div className="payment-content">
                <div className="payment-header">
                  <div className="payment-title-section">
                    <h3 className="payment-amount">${payment.amount.toLocaleString()}</h3>
                    {getStatusBadge(payment.status)}
                  </div>
                </div>

                <div className="payment-meta">
                  <div className="payment-meta-item">
                    <span className="meta-label">Date:</span>
                    <span className="meta-value">
                      {new Date(payment.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  <div className="payment-meta-item">
                    <span className="meta-label">Method:</span>
                    <span className="meta-value">{formatPaymentMethod(payment.method)}</span>
                  </div>

                  {payment.referenceNumber && (
                    <div className="payment-meta-item">
                      <span className="meta-label">Reference:</span>
                      <span className="meta-value">{payment.referenceNumber}</span>
                    </div>
                  )}
                </div>

                {payment.notes && (
                  <div className="payment-notes">
                    <strong>Notes:</strong> {payment.notes}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PaymentHistory;
