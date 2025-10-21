import React, { useState, useEffect, useMemo } from 'react';
import apiService from '../services/api';
import PaymentModal from '../components/PaymentModal';
import './RenterDashboard.css';

function RentPaymentHistory({ payments, currentTenant }) {
  const tenantPayments = payments
    .filter(payment => payment.tenantId === currentTenant?.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);

  const getStatusBadge = (status) => {
    return (
      <span className={`rent-payment-status-badge ${status}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="card">
      <h3 className="renter-section-title">
        Payment History
      </h3>
      {tenantPayments.length === 0 ? (
        <p className="rent-payment-history-empty">
          No payment history available
        </p>
      ) : (
        <div>
          {tenantPayments.map(payment => (
            <div
              key={payment.id}
              className="rent-payment-item"
            >
              <div>
                <div className="rent-payment-amount">
                  ${payment.amount.toLocaleString()}
                </div>
                <div className="rent-payment-details">
                  {new Date(payment.date).toLocaleDateString()} • {payment.method.replace(/([A-Z])/g, ' $1').replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}
                </div>
              </div>
              <div>
                {getStatusBadge(payment.status)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PropertyInfo({ property }) {
  if (!property) {
    return (
      <div className="card">
        <h3 className="renter-section-title">
          My Property
        </h3>
        <p className="property-info-empty">
          Property information not available
        </p>
      </div>
    );
  }

  const getPropertyDetails = (prop) => {
    switch (prop.type) {
      case 'apartment':
      case 'house':
      case 'condo':
        return `${prop.bedrooms || 0} bed, ${prop.bathrooms || 0} bath`;
      case 'parkingSpace':
        const details = [];
        if (prop.parkingType) details.push(prop.parkingType.replace('_', ' '));
        if (prop.spaceNumber) details.push(`Space #${prop.spaceNumber}`);
        return details.join(' • ') || 'Parking Space';
      case 'commercial':
        return prop.squareFootage ? `${prop.squareFootage.toLocaleString()} sq ft` : 'Commercial Space';
      default:
        return 'Property';
    }
  };

  return (
    <div className="card">
      <h3 className="renter-section-title">
        My Property
      </h3>
      <div className="property-info-list">
        <div>
          <strong className="property-info-name">{property.name}</strong>
        </div>
        <div className="property-info-detail">
          📍 {property.address}
        </div>
        <div className="property-info-detail">
          🏠 {property.type.replace('_', ' ')} • {getPropertyDetails(property)}
        </div>
        {property.description && (
          <div className="property-info-description">
            {property.description}
          </div>
        )}
      </div>
    </div>
  );
}

function ContractViewer({ contract, onClose }) {
  const [loading, setLoading] = useState(true);
  const [contractData, setContractData] = useState(null);

  useEffect(() => {
    loadContractData();
  }, [contract.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadContractData = async () => {
    try {
      setLoading(true);
      const data = await apiService.getContract(contract.id);
      setContractData(data);
    } catch (err) {
      console.error('Error loading contract data:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderContract = () => {
    if (!contractData || !contractData.fileContentBase64) {
      return <div>No contract content available</div>;
    }

    const mimeType = contractData.mimeType || '';

    if (mimeType.includes('pdf')) {
      const blob = new Blob([Uint8Array.from(atob(contractData.fileContentBase64), c => c.charCodeAt(0))], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      return (
        <iframe
          src={url}
          className="renter-contract-viewer-iframe"
          title="Contract Viewer"
        />
      );
    } else {
      return (
        <div className="renter-contract-viewer-unsupported">
          <div className="renter-contract-viewer-unsupported-icon">📄</div>
          <p>This file format cannot be previewed in the browser.</p>
          <p>File type: {mimeType}</p>
          <p>Please download the file to view its contents.</p>
        </div>
      );
    }
  };

  return (
    <div className="modal">
      <div className="modal-content renter-contract-viewer-modal">
        <div className="modal-header">
          <h2>View Contract: {contract.fileName}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="renter-contract-viewer-content">
          {loading ? (
            <div className="renter-contract-viewer-loading">
              Loading contract...
            </div>
          ) : (
            renderContract()
          )}
        </div>
      </div>
    </div>
  );
}

function ContractsSection({ currentTenant, onViewContract }) {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentTenant?.id) {
      loadContracts();
    }
  }, [currentTenant?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadContracts = async () => {
    try {
      setLoading(true);
      const data = await apiService.getContractsByTenant(currentTenant.id);
      setContracts(data || []);
    } catch (err) {
      console.error('Error loading contracts:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    return (
      <span className={`renter-contract-status-badge ${status}`}>
        {status}
      </span>
    );
  };

  const handleDownload = async (contract) => {
    try {
      const response = await apiService.downloadContract(contract.id);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = contract.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Failed to download contract');
      console.error('Error downloading contract:', err);
    }
  };

  if (!currentTenant) {
    return (
      <div className="card">
        <h3 className="renter-section-title">
          My Contracts
        </h3>
        <p className="contracts-section-empty">
          Tenant information not available
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="renter-section-title">
        My Contracts
      </h3>
      {loading ? (
        <div className="contracts-section-loading">
          Loading contracts...
        </div>
      ) : contracts.length === 0 ? (
        <div className="contracts-section-empty">
          <div className="contracts-section-empty-icon">📄</div>
          <p>No contracts available</p>
          <p className="contracts-section-empty-hint">Contact your property manager if you need access to your lease documents</p>
        </div>
      ) : (
        <div className="contracts-section-list">
          {contracts.map(contract => (
            <div
              key={contract.id}
              className="renter-contract-item"
            >
              <div className="renter-contract-header">
                <div>
                  <h4 className="renter-contract-title">
                    {contract.fileName}
                  </h4>
                  <div className="renter-contract-date">
                    Uploaded: {new Date(contract.uploadedAt).toLocaleDateString()}
                  </div>
                </div>
                {getStatusBadge(contract.status)}
              </div>
              {contract.notes && (
                <div className="renter-contract-notes">
                  Notes: {contract.notes}
                </div>
              )}
              {contract.signedAt && (
                <div className="renter-contract-signed">
                  Signed: {new Date(contract.signedAt).toLocaleDateString()}
                </div>
              )}
              <div className="renter-contract-actions">
                <button
                  className="btn btn-accent renter-contract-action-btn"
                  onClick={() => onViewContract(contract)}
                  title="View Contract"
                >
                  👁️
                </button>
                <button
                  className="btn btn-primary renter-contract-action-btn"
                  onClick={() => handleDownload(contract)}
                  title="Download Contract"
                >
                  ⬇️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LeaseInfo({ currentTenant }) {
  if (!currentTenant) {
    return (
      <div className="card">
        <h3 className="renter-section-title">
          Lease Information
        </h3>
        <p className="lease-info-empty">
          Lease information not available
        </p>
      </div>
    );
  }

  const leaseStart = currentTenant.leaseStart ? new Date(currentTenant.leaseStart) : null;
  const leaseEnd = currentTenant.leaseEnd ? new Date(currentTenant.leaseEnd) : null;
  const today = new Date();
  const daysUntilExpiry = leaseEnd ? Math.ceil((leaseEnd - today) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div className="card">
      <h3 className="renter-section-title">
        Lease Information
      </h3>
      <div className="lease-info-grid">
        <div className="lease-info-row">
          <span className="lease-info-label">Monthly Rent:</span>
          <span className="lease-info-value-highlight">
            ${currentTenant.rentAmount.toLocaleString()}
          </span>
        </div>

        {currentTenant.deposit > 0 && (
          <div className="lease-info-row">
            <span className="lease-info-label">Security Deposit:</span>
            <span className="lease-info-value">
              ${currentTenant.deposit.toLocaleString()}
            </span>
          </div>
        )}

        {leaseStart && (
          <div className="lease-info-row">
            <span className="lease-info-label">Lease Start:</span>
            <span className="lease-info-value">
              {leaseStart.toLocaleDateString()}
            </span>
          </div>
        )}

        {leaseEnd && (
          <div className="lease-info-row">
            <span className="lease-info-label">Lease End:</span>
            <span className="lease-info-value">
              {leaseEnd.toLocaleDateString()}
            </span>
          </div>
        )}

        {daysUntilExpiry !== null && (
          <div className={`lease-info-expiry ${daysUntilExpiry < 30 ? 'warning' : ''}`}>
            <span className="lease-info-label">Days Until Expiry:</span>
            <span className={`lease-info-expiry-value ${daysUntilExpiry < 30 ? 'warning' : 'success'}`}>
              {daysUntilExpiry > 0 ? `${daysUntilExpiry} days` : 'Expired'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function NextPaymentDue({ currentTenant, payments, onPaymentSuccess }) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  if (!currentTenant) return null;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentDate = new Date();

  const currentMonthPayments = payments.filter(payment => {
    const paymentDate = new Date(payment.date);
    return payment.tenantId === currentTenant.id &&
           payment.status === 'completed' &&
           paymentDate.getMonth() === currentMonth &&
           paymentDate.getFullYear() === currentYear;
  });

  const totalPaid = currentMonthPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const amountDue = currentTenant.rentAmount - totalPaid;
  const isOverdue = amountDue > 0 && currentDate.getDate() > 5;

  // Calculate next due date (5th of current/next month)
  const nextDueDate = new Date();
  if (amountDue <= 0 || currentDate.getDate() > 5) {
    // If paid or past due date, show next month
    nextDueDate.setMonth(nextDueDate.getMonth() + 1);
  }
  nextDueDate.setDate(5);

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    if (onPaymentSuccess) {
      onPaymentSuccess();
    }
  };

  return (
    <div className="card">
      <h3 className="renter-section-title">
        Next Payment Due
      </h3>
      {amountDue <= 0 ? (
        <div className="next-payment-paid">
          <div className="next-payment-paid-icon">✅</div>
          <div className="next-payment-paid-text">
            All Caught Up!
          </div>
          <div className="next-payment-paid-date">
            Next payment due: {nextDueDate.toLocaleDateString()}
          </div>
        </div>
      ) : (
        <div className={`next-payment-due ${isOverdue ? 'overdue' : ''}`}>
          <div className={`next-payment-amount ${isOverdue ? 'danger' : 'warning'}`}>
            ${amountDue.toLocaleString()}
          </div>
          <div className={`next-payment-status ${isOverdue ? 'danger' : 'warning'}`}>
            {isOverdue ? 'OVERDUE' : 'Due Soon'}
          </div>
          <div className="next-payment-date">
            Due Date: {nextDueDate.toLocaleDateString()}
          </div>
          {totalPaid > 0 && (
            <div className="next-payment-partial">
              ${totalPaid.toLocaleString()} already paid this month
            </div>
          )}
          <button
            onClick={() => setShowPaymentModal(true)}
            className="btn btn-primary next-payment-button"
          >
            Pay Now
          </button>
        </div>
      )}

      <PaymentModal
        isOpen={showPaymentModal}
        amount={amountDue}
        tenantId={currentTenant.id}
        onSuccess={handlePaymentSuccess}
        onClose={() => setShowPaymentModal(false)}
      />
    </div>
  );
}

function MaintenanceRequests() {
  // Mock maintenance requests - in a real app, this would come from API
  const [requests] = useState([
    {
      id: 1,
      title: 'Leaky Faucet in Kitchen',
      status: 'in_progress',
      priority: 'medium',
      dateSubmitted: '2024-01-15',
      description: 'Kitchen sink faucet has been dripping consistently'
    },
    {
      id: 2,
      title: 'AC Unit Making Noise',
      status: 'pending',
      priority: 'low',
      dateSubmitted: '2024-01-10',
      description: 'Air conditioning unit making unusual sounds'
    }
  ]);

  const getStatusBadge = (status) => {
    return (
      <span className={`maintenance-status-badge ${status}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getPriorityIcon = (priority) => {
    const icons = {
      high: '🔴',
      medium: '🟡',
      low: '🟢'
    };
    return icons[priority] || '🟡';
  };

  return (
    <div className="card">
      <h3 className="renter-section-title">
        Maintenance Requests
      </h3>
      {requests.length === 0 ? (
        <div className="maintenance-empty">
          <div className="maintenance-empty-icon">🔧</div>
          <p>No maintenance requests</p>
          <p className="maintenance-empty-hint">Submit a request if you need assistance</p>
        </div>
      ) : (
        <div>
          {requests.map(request => (
            <div
              key={request.id}
              className="maintenance-request-item"
            >
              <div className="maintenance-request-header">
                <div className="maintenance-request-title-row">
                  <span>{getPriorityIcon(request.priority)}</span>
                  <strong className="maintenance-request-title">{request.title}</strong>
                </div>
                {getStatusBadge(request.status)}
              </div>
              <p className="maintenance-request-description">
                {request.description}
              </p>
              <div className="maintenance-request-date">
                Submitted: {new Date(request.dateSubmitted).toLocaleDateString()}
              </div>
            </div>
          ))}
          <button
            className="btn btn-accent maintenance-submit-button"
            onClick={() => alert('Maintenance request form would open here')}
          >
            + Submit New Request
          </button>
        </div>
      )}
    </div>
  );
}

function ImportantNotices() {
  const notices = [
    {
      id: 1,
      title: 'Building Maintenance Schedule',
      message: 'Elevator maintenance on January 25th from 9 AM - 12 PM. Please use stairs during this time.',
      type: 'info',
      date: '2024-01-20'
    },
    {
      id: 2,
      title: 'Rent Increase Notice',
      message: 'Effective March 1st, monthly rent will increase by 3% as outlined in your lease agreement.',
      type: 'warning',
      date: '2024-01-18'
    },
    {
      id: 3,
      title: 'Holiday Office Hours',
      message: 'Property management office will be closed on February 19th for Presidents Day.',
      type: 'info',
      date: '2024-01-15'
    }
  ];

  const getNoticeIcon = (type) => {
    const icons = {
      info: '💡',
      warning: '⚠️',
      urgent: '🚨'
    };
    return icons[type] || '📢';
  };

  return (
    <div className="card">
      <h3 className="renter-section-title">
        Important Notices
      </h3>
      <div>
        {notices.map(notice => (
          <div
            key={notice.id}
            className={`notice-item ${notice.type}`}
          >
            <div className="notice-content">
              <span className="notice-icon">{getNoticeIcon(notice.type)}</span>
              <div className="notice-text">
                <h4 className={`notice-title ${notice.type}`}>
                  {notice.title}
                </h4>
                <p className="notice-message">
                  {notice.message}
                </p>
                <div className="notice-date">
                  {new Date(notice.date).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactInfo() {
  const contacts = [
    {
      title: 'Property Manager',
      name: 'Sarah Johnson',
      phone: '+1 (555) 123-4567',
      email: 'sarah.johnson@avm.com',
      hours: 'Mon-Fri 9 AM - 5 PM'
    },
    {
      title: 'Emergency Maintenance',
      name: '24/7 Emergency Line',
      phone: '+1 (555) 999-0000',
      email: 'emergency@avm.com',
      hours: 'Available 24/7'
    },
    {
      title: 'Accounting Department',
      name: 'AVM Accounting',
      phone: '+1 (555) 123-4568',
      email: 'billing@avm.com',
      hours: 'Mon-Fri 8 AM - 4 PM'
    }
  ];

  return (
    <div className="card">
      <h3 className="renter-section-title">
        Contact Information
      </h3>
      <div className="contact-info-list">
        {contacts.map((contact, index) => (
          <div key={index} className="contact-info-item">
            <h4 className="contact-info-title">
              {contact.title}
            </h4>
            <div className="contact-info-name">
              {contact.name}
            </div>
            <div className="contact-info-details">
              <div className="contact-info-detail">
                📞 {contact.phone}
              </div>
              <div className="contact-info-detail">
                📧 {contact.email}
              </div>
              <div className="contact-info-hours">
                🕒 {contact.hours}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RenterDashboard() {
  const [tenants, setTenants] = useState([]);
  const [payments, setPayments] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewingContract, setViewingContract] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tenantsData, paymentsData, propertiesData] = await Promise.all([
        apiService.getTenants(),
        apiService.getPayments(),
        apiService.getProperties()
      ]);
      setTenants(tenantsData || []);
      setPayments(paymentsData || []);
      setProperties(propertiesData || []);
      setError(null);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentTenant = useMemo(() => {
    // Use the first active tenant found
    return tenants.find(t => t.status.toLowerCase() === 'active') || null;
  }, [tenants]);

  const currentProperty = useMemo(() => {
    if (!currentTenant) return null;
    return properties.find(p => p.id === currentTenant.propertyId) || null;
  }, [currentTenant, properties]);

  const rentStats = useMemo(() => {
    if (!currentTenant) return { totalPaid: 0, paymentsCount: 0, avgPayment: 0 };
    
    const tenantPayments = payments.filter(p => p.tenantId === currentTenant.id && p.status.toLowerCase() === 'completed');
    const totalPaid = tenantPayments.reduce((sum, p) => sum + p.amount, 0);
    const paymentsCount = tenantPayments.length;
    const avgPayment = paymentsCount > 0 ? totalPaid / paymentsCount : 0;
    
    return { totalPaid, paymentsCount, avgPayment };
  }, [currentTenant, payments]);

  if (loading) {
    return (
      <div className="renter-dashboard-loading">
        <h1>Renter Dashboard</h1>
        <p>Loading your rental information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="renter-dashboard-error">
        <h1>Renter Dashboard</h1>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={loadData}>
          Try Again
        </button>
      </div>
    );
  }

  if (!currentTenant) {
    return (
      <div className="renter-dashboard-no-tenant">
        <h1>Renter Dashboard</h1>
        <p>No active tenant data found. Please contact your property manager.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="renter-dashboard-header">
        <div>
          <h1 className="renter-dashboard-title">
            Renter Dashboard
          </h1>
          <p className="renter-dashboard-subtitle">
            Welcome back, {currentTenant.name}
          </p>
        </div>
      </div>

      {!currentTenant ? (
        <div className="card">
          <div className="no-tenant-profile">
            <h3>No Tenant Profile Found</h3>
            <p>Please contact your property manager to set up your tenant profile.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="dashboard-grid">
            <div className="stat-card">
              <div className="stat-number">${currentTenant.rentAmount.toLocaleString()}</div>
              <div className="stat-label">Monthly Rent</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{rentStats.paymentsCount}</div>
              <div className="stat-label">Total Payments Made</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">${rentStats.totalPaid.toLocaleString()}</div>
              <div className="stat-label">Total Amount Paid</div>
            </div>
            <div className="stat-card">
              <div className={`stat-number ${currentTenant.status === 'active' ? 'lease-status-active' : 'lease-status-inactive'}`}>
                {currentTenant.status.charAt(0).toUpperCase() + currentTenant.status.slice(1)}
              </div>
              <div className="stat-label">Lease Status</div>
            </div>
          </div>

          {/* Payment Due Section */}
          <NextPaymentDue
            currentTenant={currentTenant}
            payments={payments}
            onPaymentSuccess={loadData}
          />

          {/* Main Content Grid */}
          <div className="renter-content-grid">
            <div>
              <PropertyInfo property={currentProperty} />
              <LeaseInfo currentTenant={currentTenant} />
              <ContractsSection
                currentTenant={currentTenant}
                onViewContract={setViewingContract}
              />
              <ContactInfo />
            </div>
            <div>
              <RentPaymentHistory payments={payments} currentTenant={currentTenant} />
              <MaintenanceRequests />
            </div>
          </div>

          {/* Full Width Notices */}
          <ImportantNotices />
        </>
      )}

      {viewingContract && (
        <ContractViewer
          contract={viewingContract}
          onClose={() => setViewingContract(null)}
        />
      )}
    </div>
  );
}

export default RenterDashboard;