import React, { useMemo } from 'react';

function RecentPayments({ payments, tenants, properties }) {
  const recentPayments = payments
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

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

  return (
    <div className="card">
      <h3 style={{ marginBottom: '20px' }}>Recent Payments</h3>
      {recentPayments.length === 0 ? (
        <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
          No payments recorded yet
        </p>
      ) : (
        <div>
          {recentPayments.map(payment => (
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
                <div style={{ fontWeight: '500' }}>{getTenantName(payment.tenantId)}</div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  {getPropertyName(payment.tenantId)} • {new Date(payment.date).toLocaleDateString()}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: '500', color: '#28a745' }}>
                  ${payment.amount.toLocaleString()}
                </div>
                <div style={{ fontSize: '12px', color: '#666', textTransform: 'capitalize' }}>
                  {payment.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UpcomingRent({ tenants, payments, properties }) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const upcomingRent = tenants
    .filter(tenant => tenant.status === 'active')
    .map(tenant => {
      const currentMonthPayments = payments.filter(payment => {
        const paymentDate = new Date(payment.date);
        return payment.tenantId === tenant.id && 
               payment.status === 'completed' &&
               paymentDate.getMonth() === currentMonth &&
               paymentDate.getFullYear() === currentYear;
      });

      const totalPaid = currentMonthPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const property = properties.find(p => p.id === tenant.propertyId);
      
      return {
        tenant,
        property,
        amountDue: tenant.rentAmount - totalPaid,
        totalPaid,
        isOverdue: totalPaid < tenant.rentAmount && new Date().getDate() > 5
      };
    })
    .filter(item => item.amountDue > 0)
    .sort((a, b) => b.amountDue - a.amountDue);

  return (
    <div className="card">
      <h3 style={{ marginBottom: '20px' }}>Outstanding Rent</h3>
      {upcomingRent.length === 0 ? (
        <p style={{ color: '#28a745', textAlign: 'center', padding: '20px' }}>
          All rent payments are up to date! 🎉
        </p>
      ) : (
        <div>
          {upcomingRent.map(({ tenant, property, amountDue, totalPaid, isOverdue }) => (
            <div
              key={tenant.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid #eee',
                backgroundColor: isOverdue ? '#fff5f5' : 'transparent',
                marginLeft: isOverdue ? '-20px' : '0',
                marginRight: isOverdue ? '-20px' : '0',
                paddingLeft: isOverdue ? '20px' : '0',
                paddingRight: isOverdue ? '20px' : '0'
              }}
            >
              <div>
                <div style={{ fontWeight: '500' }}>
                  {tenant.name}
                  {isOverdue && <span style={{ color: '#dc3545', marginLeft: '8px' }}>OVERDUE</span>}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  {property?.name || 'Unknown Property'}
                  {totalPaid > 0 && ` • $${totalPaid.toLocaleString()} paid`}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ 
                  fontWeight: '500', 
                  color: isOverdue ? '#dc3545' : '#ffc107' 
                }}>
                  ${amountDue.toLocaleString()} due
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  of ${tenant.rentAmount.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function Dashboard({ properties, tenants, payments }) {
  const stats = useMemo(() => {
    const totalProperties = properties.length;
    const totalTenants = tenants.filter(t => t.status === 'active').length;
    const vacantProperties = totalProperties - totalTenants;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const currentMonthPayments = payments.filter(payment => {
      const paymentDate = new Date(payment.date);
      return payment.status === 'completed' &&
             paymentDate.getMonth() === currentMonth &&
             paymentDate.getFullYear() === currentYear;
    });
    
    const monthlyRevenue = currentMonthPayments.reduce((sum, payment) => sum + payment.amount, 0);
    
    const expectedMonthlyRevenue = tenants
      .filter(t => t.status === 'active')
      .reduce((sum, tenant) => sum + tenant.rentAmount, 0);
    
    const collectionRate = expectedMonthlyRevenue > 0 
      ? ((monthlyRevenue / expectedMonthlyRevenue) * 100).toFixed(1)
      : '0.0';

    const overduePayments = tenants
      .filter(tenant => tenant.status === 'active')
      .map(tenant => {
        const tenantPayments = currentMonthPayments.filter(p => p.tenantId === tenant.id);
        const totalPaid = tenantPayments.reduce((sum, p) => sum + p.amount, 0);
        return {
          tenant,
          amountDue: tenant.rentAmount - totalPaid,
          isOverdue: totalPaid < tenant.rentAmount && new Date().getDate() > 5
        };
      })
      .filter(item => item.isOverdue && item.amountDue > 0).length;

    return {
      totalProperties,
      totalTenants,
      vacantProperties,
      monthlyRevenue,
      expectedMonthlyRevenue,
      collectionRate,
      overduePayments
    };
  }, [properties, tenants, payments]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1>AVM Property Management</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '5px 0 0 0', fontSize: '1.1rem' }}>
            Professional Property Management Solutions
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

      {(properties.length === 0 || tenants.length === 0) && (
        <div className="card" style={{ backgroundColor: '#e3f2fd', border: '1px solid #2196f3' }}>
          <h3 style={{ color: '#1976d2', marginBottom: '15px' }}>Getting Started</h3>
          <p style={{ marginBottom: '15px', color: '#1565c0' }}>
            Welcome to Rent Manager! To get the most out of your dashboard, follow these steps:
          </p>
          <ol style={{ marginLeft: '20px', color: '#1565c0' }}>
            <li style={{ marginBottom: '8px' }}>
              {properties.length === 0 ? '📍 ' : '✅ '}
              Add your rental properties in the Properties section
            </li>
            <li style={{ marginBottom: '8px' }}>
              {tenants.length === 0 ? '👤 ' : '✅ '}
              Add tenants and assign them to properties
            </li>
            <li style={{ marginBottom: '8px' }}>
              💰 Start recording rent payments to track your revenue
            </li>
          </ol>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <UpcomingRent tenants={tenants} payments={payments} properties={properties} />
        <RecentPayments payments={payments} tenants={tenants} properties={properties} />
      </div>
    </div>
  );
}

export default Dashboard;