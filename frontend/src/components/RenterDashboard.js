import React, { useState, useEffect, useMemo } from 'react';
import apiService from '../services/api';

function RentPaymentHistory({ payments, currentTenant }) {
  const tenantPayments = payments
    .filter(payment => payment.tenantId === currentTenant?.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);

  const getStatusBadge = (status) => {
    const colors = {
      completed: '#28a745',
      pending: '#ffc107',
      failed: '#dc3545'
    };
    return (
      <span
        style={{
          backgroundColor: colors[status] || colors.pending,
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          textTransform: 'capitalize'
        }}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="card">
      <h3 style={{ marginBottom: '20px', color: 'var(--primary-color)' }}>
        Payment History
      </h3>
      {tenantPayments.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
          No payment history available
        </p>
      ) : (
        <div>
          {tenantPayments.map(payment => (
            <div
              key={payment.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid var(--border-color)'
              }}
            >
              <div>
                <div style={{ fontWeight: '500' }}>
                  ${payment.amount.toLocaleString()}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  {new Date(payment.date).toLocaleDateString()} • {payment.method.replace(/([A-Z])/g, ' $1').replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
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
        <h3 style={{ marginBottom: '20px', color: 'var(--primary-color)' }}>
          My Property
        </h3>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
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
      <h3 style={{ marginBottom: '20px', color: 'var(--primary-color)' }}>
        My Property
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>{property.name}</strong>
        </div>
        <div style={{ color: 'var(--text-secondary)' }}>
          📍 {property.address}
        </div>
        <div style={{ color: 'var(--text-secondary)' }}>
          🏠 {property.type.replace('_', ' ')} • {getPropertyDetails(property)}
        </div>
        {property.description && (
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>
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
          style={{ width: '100%', height: '600px', border: 'none' }}
          title="Contract Viewer"
        />
      );
    } else {
      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '20px' }}>📄</div>
          <p>This file format cannot be previewed in the browser.</p>
          <p>File type: {mimeType}</p>
          <p>Please download the file to view its contents.</p>
        </div>
      );
    }
  };

  return (
    <div className="modal">
      <div className="modal-content" style={{ maxWidth: '900px', height: '80vh' }}>
        <div className="modal-header">
          <h2>View Contract: {contract.fileName}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div style={{ padding: '20px', height: 'calc(100% - 60px)', overflow: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
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
    const colors = {
      draft: '#6c757d',
      pending: '#ffc107',
      signed: '#28a745',
      terminated: '#dc3545'
    };
    return (
      <span
        style={{
          backgroundColor: colors[status] || colors.draft,
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          textTransform: 'capitalize'
        }}
      >
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
        <h3 style={{ marginBottom: '20px', color: 'var(--primary-color)' }}>
          My Contracts
        </h3>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
          Tenant information not available
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 style={{ marginBottom: '20px', color: 'var(--primary-color)' }}>
        My Contracts
      </h3>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
          Loading contracts...
        </div>
      ) : contracts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📄</div>
          <p>No contracts available</p>
          <p style={{ fontSize: '0.9rem' }}>Contact your property manager if you need access to your lease documents</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {contracts.map(contract => (
            <div
              key={contract.id}
              style={{
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '16px',
                backgroundColor: 'var(--bg-tertiary)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                    {contract.fileName}
                  </h4>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Uploaded: {new Date(contract.uploadedAt).toLocaleDateString()}
                  </div>
                </div>
                {getStatusBadge(contract.status)}
              </div>
              {contract.notes && (
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Notes: {contract.notes}
                </div>
              )}
              {contract.signedAt && (
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Signed: {new Date(contract.signedAt).toLocaleDateString()}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                <button
                  className="btn btn-accent"
                  style={{ padding: '6px 10px', fontSize: '16px', minWidth: '36px' }}
                  onClick={() => onViewContract(contract)}
                  title="View Contract"
                >
                  👁️
                </button>
                <button
                  className="btn btn-primary"
                  style={{ padding: '6px 10px', fontSize: '16px', minWidth: '36px' }}
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
        <h3 style={{ marginBottom: '20px', color: 'var(--primary-color)' }}>
          Lease Information
        </h3>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
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
      <h3 style={{ marginBottom: '20px', color: 'var(--primary-color)' }}>
        Lease Information
      </h3>
      <div style={{ display: 'grid', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Monthly Rent:</span>
          <span style={{ fontWeight: '600', color: 'var(--primary-color)' }}>
            ${currentTenant.rentAmount.toLocaleString()}
          </span>
        </div>
        
        {currentTenant.deposit > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Security Deposit:</span>
            <span style={{ fontWeight: '500' }}>
              ${currentTenant.deposit.toLocaleString()}
            </span>
          </div>
        )}
        
        {leaseStart && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Lease Start:</span>
            <span style={{ fontWeight: '500' }}>
              {leaseStart.toLocaleDateString()}
            </span>
          </div>
        )}
        
        {leaseEnd && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Lease End:</span>
            <span style={{ fontWeight: '500' }}>
              {leaseEnd.toLocaleDateString()}
            </span>
          </div>
        )}
        
        {daysUntilExpiry !== null && (
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              padding: '12px',
              backgroundColor: daysUntilExpiry < 30 ? '#fff3cd' : 'var(--bg-tertiary)',
              borderRadius: '8px',
              border: daysUntilExpiry < 30 ? '1px solid #ffeaa7' : '1px solid var(--border-color)'
            }}
          >
            <span style={{ color: 'var(--text-secondary)' }}>Days Until Expiry:</span>
            <span style={{ 
              fontWeight: '600', 
              color: daysUntilExpiry < 30 ? 'var(--warning-color)' : 'var(--success-color)' 
            }}>
              {daysUntilExpiry > 0 ? `${daysUntilExpiry} days` : 'Expired'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function NextPaymentDue({ currentTenant, payments }) {
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

  return (
    <div className="card">
      <h3 style={{ marginBottom: '20px', color: 'var(--primary-color)' }}>
        Next Payment Due
      </h3>
      {amountDue <= 0 ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>✅</div>
          <div style={{ fontWeight: '600', color: 'var(--success-color)', fontSize: '1.1rem' }}>
            All Caught Up!
          </div>
          <div style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            Next payment due: {nextDueDate.toLocaleDateString()}
          </div>
        </div>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px',
          backgroundColor: isOverdue ? '#fff5f5' : '#fff8f0',
          borderRadius: '8px',
          border: `1px solid ${isOverdue ? '#fecaca' : '#fed7aa'}`
        }}>
          <div style={{ 
            fontSize: '2.5rem', 
            fontWeight: '700',
            color: isOverdue ? 'var(--danger-color)' : 'var(--warning-color)',
            marginBottom: '8px'
          }}>
            ${amountDue.toLocaleString()}
          </div>
          <div style={{ 
            fontWeight: '600', 
            color: isOverdue ? 'var(--danger-color)' : 'var(--warning-color)',
            fontSize: '1.1rem',
            marginBottom: '8px'
          }}>
            {isOverdue ? 'OVERDUE' : 'Due Soon'}
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>
            Due Date: {nextDueDate.toLocaleDateString()}
          </div>
          {totalPaid > 0 && (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              ${totalPaid.toLocaleString()} already paid this month
            </div>
          )}
        </div>
      )}
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
    const colors = {
      pending: '#ffc107',
      in_progress: '#007bff',
      completed: '#28a745',
      cancelled: '#dc3545'
    };
    return (
      <span
        style={{
          backgroundColor: colors[status] || colors.pending,
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          textTransform: 'capitalize'
        }}
      >
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
      <h3 style={{ marginBottom: '20px', color: 'var(--primary-color)' }}>
        Maintenance Requests
      </h3>
      {requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🔧</div>
          <p>No maintenance requests</p>
          <p style={{ fontSize: '0.9rem' }}>Submit a request if you need assistance</p>
        </div>
      ) : (
        <div>
          {requests.map(request => (
            <div
              key={request.id}
              style={{
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                marginBottom: '12px',
                backgroundColor: 'var(--bg-tertiary)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{getPriorityIcon(request.priority)}</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{request.title}</strong>
                </div>
                {getStatusBadge(request.status)}
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>
                {request.description}
              </p>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Submitted: {new Date(request.dateSubmitted).toLocaleDateString()}
              </div>
            </div>
          ))}
          <button 
            className="btn btn-accent"
            style={{ width: '100%', marginTop: '12px' }}
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

  const getNoticeColor = (type) => {
    const colors = {
      info: 'var(--primary-color)',
      warning: 'var(--warning-color)',
      urgent: 'var(--danger-color)'
    };
    return colors[type] || 'var(--primary-color)';
  };

  return (
    <div className="card">
      <h3 style={{ marginBottom: '20px', color: 'var(--primary-color)' }}>
        Important Notices
      </h3>
      <div>
        {notices.map(notice => (
          <div
            key={notice.id}
            style={{
              padding: '16px',
              borderRadius: '8px',
              border: `1px solid ${getNoticeColor(notice.type)}20`,
              backgroundColor: `${getNoticeColor(notice.type)}08`,
              marginBottom: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <span style={{ fontSize: '1.2rem' }}>{getNoticeIcon(notice.type)}</span>
              <div style={{ flex: 1 }}>
                <h4 style={{ 
                  color: getNoticeColor(notice.type), 
                  marginBottom: '8px',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}>
                  {notice.title}
                </h4>
                <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: '8px' }}>
                  {notice.message}
                </p>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
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
      <h3 style={{ marginBottom: '20px', color: 'var(--primary-color)' }}>
        Contact Information
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {contacts.map((contact, index) => (
          <div key={index} style={{ 
            padding: '16px', 
            backgroundColor: 'var(--bg-tertiary)', 
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            <h4 style={{ color: 'var(--primary-color)', marginBottom: '8px', fontSize: '1rem' }}>
              {contact.title}
            </h4>
            <div style={{ color: 'var(--text-primary)', fontWeight: '500', marginBottom: '4px' }}>
              {contact.name}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.9rem' }}>
              <div style={{ color: 'var(--text-secondary)' }}>
                📞 {contact.phone}
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>
                📧 {contact.email}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
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
      <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
        <h1>Renter Dashboard</h1>
        <p>Loading your rental information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#dc3545' }}>
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
      <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
        <h1>Renter Dashboard</h1>
        <p>No active tenant data found. Please contact your property manager.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1>Renter Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '5px 0 0 0', fontSize: '1.1rem' }}>
            Welcome back, {currentTenant.name}
          </p>
        </div>
      </div>

      {!currentTenant ? (
        <div className="card">
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
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
              <div className="stat-number" style={{ 
                color: currentTenant.status === 'active' ? 'var(--success-color)' : 'var(--warning-color)' 
              }}>
                {currentTenant.status.charAt(0).toUpperCase() + currentTenant.status.slice(1)}
              </div>
              <div className="stat-label">Lease Status</div>
            </div>
          </div>

          {/* Payment Due Section */}
          <NextPaymentDue currentTenant={currentTenant} payments={payments} />

          {/* Main Content Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
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