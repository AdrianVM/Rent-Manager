import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import { PrimaryButton, SecondaryButton, DangerButton, Table } from '../../components/common';
import './Payments.css';

function PaymentForm({ payment, onSave, onCancel, tenants, properties }) {
  const [formData, setFormData] = useState({
    tenantId: payment?.tenantId || '',
    amount: payment?.amount || '',
    date: payment?.date || new Date().toISOString().split('T')[0],
    method: payment?.method || 'cash',
    status: payment?.status || 'completed',
    notes: payment?.notes || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.tenantId || !formData.amount || !formData.date) {
      alert('Please fill in all required fields');
      return;
    }

    const paymentData = {
      ...formData,
      id: payment?.id || Date.now().toString(),
      amount: parseFloat(formData.amount) || 0
    };

    onSave(paymentData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };


  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{payment ? 'Edit Payment' : 'Record New Payment'}</h2>
          <button className="close-btn" onClick={onCancel}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tenant *</label>
            <select
              name="tenantId"
              value={formData.tenantId}
              onChange={handleChange}
              className="form-control"
              required
            >
              <option value="">Select a tenant</option>
              {tenants.filter(t => t.status === 'active').map(tenant => {
                const property = properties.find(p => p.id === tenant.propertyId);
                return (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name} - {property?.name || 'Unknown Property'}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Amount *</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                className="form-control"
                step="0.01"
                min="0"
                required
              />
            </div>
            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Payment Method</label>
              <select
                name="method"
                value={formData.method}
                onChange={handleChange}
                className="form-control"
              >
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="bankTransfer">Bank Transfer</option>
                <option value="creditCard">Credit Card</option>
                <option value="online">Online Payment</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-control"
              >
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="form-control"
              rows="3"
              placeholder="Additional notes about this payment..."
            />
          </div>
          <div className="payment-form-actions">
            <SecondaryButton type="button" onClick={onCancel}>Cancel</SecondaryButton>
            <PrimaryButton type="submit">Save Payment</PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}

function Payments() {
  const [payments, setPayments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [paymentsData, tenantsData, propertiesData] = await Promise.all([
        apiService.getPayments(),
        apiService.getTenants(),
        apiService.getProperties()
      ]);
      setPayments(paymentsData || []);
      setTenants(tenantsData || []);
      setProperties(propertiesData || []);
      setError(null);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = () => {
    const activeTenantsExist = tenants.some(t => t.status === 'Active');
    if (!activeTenantsExist) {
      alert('Please add at least one active tenant before recording payments');
      return;
    }
    setEditingPayment(null);
    setShowForm(true);
  };

  const handleEditPayment = (payment) => {
    setEditingPayment(payment);
    setShowForm(true);
  };

  const handleSavePayment = async (paymentData) => {
    try {
      if (editingPayment) {
        await apiService.updatePayment(editingPayment.id, paymentData);
      } else {
        await apiService.createPayment(paymentData);
      }
      await loadData(); // Reload data from server
      setShowForm(false);
      setEditingPayment(null);
    } catch (err) {
      alert('Failed to save payment. Please try again.');
      console.error('Error saving payment:', err);
    }
  };

  const handleDeletePayment = async (id) => {
    if (window.confirm('Are you sure you want to delete this payment record?')) {
      try {
        await apiService.deletePayment(id);
        await loadData(); // Reload data from server
      } catch (err) {
        alert('Failed to delete payment. Please try again.');
        console.error('Error deleting payment:', err);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPayment(null);
  };

  const getTenantName = (tenantId) => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant ? tenant.name : 'Unknown Tenant';
  };

  const getPropertyName = (tenantId) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return 'Unknown Property';
    const property = properties.find(p => p.id === tenant.propertyId);
    return property ? property.name : 'Unknown Property';
  };

  const getStatusBadge = (status) => {
    return (
      <span className={`payment-status-badge ${status.toLowerCase()}`}>
        {status}
      </span>
    );
  };

  const filteredPayments = payments.filter(payment => {
    if (filter === 'all') return true;
    return payment.status.toLowerCase() === filter;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalPayments = payments
    .filter(p => p.status.toLowerCase() === 'completed')
    .reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <>
      <div className="payments-header">
        <h1>Rent Payments</h1>
        <PrimaryButton onClick={handleAddPayment}>
          Record Payment
        </PrimaryButton>
      </div>

      <div className="dashboard-grid payments-stats-grid">
        <div className="stat-card">
          <div className="stat-number">${totalPayments.toLocaleString()}</div>
          <div className="stat-label">Total Collected</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{payments.filter(p => p.status.toLowerCase() === 'completed').length}</div>
          <div className="stat-label">Completed Payments</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{payments.filter(p => p.status.toLowerCase() === 'pending').length}</div>
          <div className="stat-label">Pending Payments</div>
        </div>
      </div>

      <div className="card">
        <div className="payments-filter-section">
          <label className="payments-filter-label">Filter by status:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="form-control payments-filter-select"
          >
            <option value="all">All Payments</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {loading ? (
          <div className="payments-loading">
            <p>Loading payments...</p>
          </div>
        ) : error ? (
          <div className="payments-error">
            <p>{error}</p>
            <PrimaryButton onClick={loadData}>
              Try Again
            </PrimaryButton>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="payments-empty">
            <h3>No payments found</h3>
            <p>
              {filter === 'all'
                ? 'Record your first payment to start tracking rent collection'
                : `No ${filter} payments found`
              }
            </p>
            {tenants.filter(t => t.status.toLowerCase() === 'active').length === 0 && (
              <p className="payments-empty-warning">
                Note: You need to have active tenants before recording payments
              </p>
            )}
          </div>
        ) : (
          <Table
            columns={[
              {
                header: 'Date',
                render: (payment) => new Date(payment.date).toLocaleDateString()
              },
              {
                header: 'Tenant',
                render: (payment) => getTenantName(payment.tenantId)
              },
              {
                header: 'Property',
                render: (payment) => getPropertyName(payment.tenantId)
              },
              {
                header: 'Amount',
                render: (payment) => `$${payment.amount.toLocaleString()}`
              },
              {
                header: 'Method',
                cellClassName: 'payment-method-text',
                render: (payment) => payment.method.replace(/([A-Z])/g, ' $1').replace('_', ' ').replace(/^\w/, c => c.toUpperCase())
              },
              {
                header: 'Status',
                render: (payment) => getStatusBadge(payment.status)
              },
              {
                header: 'Actions',
                render: (payment) => (
                  <div className="payments-action-buttons">
                    <PrimaryButton
                      onClick={() => handleEditPayment(payment)}
                      title="Edit Payment"
                      className="payment-action-btn"
                    >
                      ✏️
                    </PrimaryButton>
                    <DangerButton
                      onClick={() => handleDeletePayment(payment.id)}
                      title="Delete Payment"
                      className="payment-action-btn"
                    >
                      🗑️
                    </DangerButton>
                  </div>
                )
              }
            ]}
            data={filteredPayments}
            emptyMessage={filter === 'all' ? 'No payments found' : `No ${filter} payments found`}
            renderMobileCard={(payment) => (
              <>
                <div className="card-item-header">
                  ${payment.amount.toLocaleString()} - {new Date(payment.date).toLocaleDateString()}
                </div>
                <div className="card-item-details">
                  <div className="card-item-detail">
                    <span className="card-item-label">Tenant:</span>
                    <span className="card-item-value">{getTenantName(payment.tenantId)}</span>
                  </div>
                  <div className="card-item-detail">
                    <span className="card-item-label">Property:</span>
                    <span className="card-item-value">{getPropertyName(payment.tenantId)}</span>
                  </div>
                  <div className="card-item-detail">
                    <span className="card-item-label">Method:</span>
                    <span className="card-item-value payment-method-text">
                      {payment.method.replace(/([A-Z])/g, ' $1').replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}
                    </span>
                  </div>
                  <div className="card-item-detail">
                    <span className="card-item-label">Status:</span>
                    <span className="card-item-value">{getStatusBadge(payment.status)}</span>
                  </div>
                </div>
                <div className="card-item-actions payments-mobile-actions">
                  <PrimaryButton
                    onClick={() => handleEditPayment(payment)}
                    title="Edit Payment"
                    className="payments-mobile-action-btn"
                  >
                    ✏️
                  </PrimaryButton>
                  <DangerButton
                    onClick={() => handleDeletePayment(payment.id)}
                    title="Delete Payment"
                    className="payments-mobile-action-btn"
                  >
                    🗑️
                  </DangerButton>
                </div>
              </>
            )}
          />
        )}
      </div>

      {showForm && (
        <PaymentForm
          payment={editingPayment}
          onSave={handleSavePayment}
          onCancel={handleCancel}
          tenants={tenants}
          properties={properties}
        />
      )}
    </>
  );
}

export default Payments;