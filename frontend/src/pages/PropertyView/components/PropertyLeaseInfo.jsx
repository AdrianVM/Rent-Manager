import React from 'react';

const PropertyLeaseInfo = ({ tenant }) => {
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get tenant name (handles both person and company types)
  const getTenantName = () => {
    if (tenant.type === 'company') {
      return tenant.companyName || tenant.name;
    }
    return tenant.name;
  };

  // Determine if tenant is active
  const isActive = tenant.status?.toLowerCase() === 'active';

  return (
    <div className="property-view-section">
      <div className="property-view-card">
        <h2 className="property-view-section-title">Lease & Tenant Information</h2>
        <div className="property-lease-grid">
          <div className="property-lease-item">
            <div className="property-lease-label">Tenant</div>
            <div className="property-lease-value">
              {getTenantName()}
              <span className={`property-lease-status-badge ${isActive ? 'active' : 'inactive'}`}>
                {tenant.status || 'Active'}
              </span>
            </div>
          </div>
          <div className="property-lease-item">
            <div className="property-lease-label">Lease Start Date</div>
            <div className="property-lease-value">{formatDate(tenant.leaseStartDate)}</div>
          </div>
          <div className="property-lease-item">
            <div className="property-lease-label">Lease End Date</div>
            <div className="property-lease-value">{formatDate(tenant.leaseEndDate)}</div>
          </div>
          {tenant.type === 'company' && tenant.contactPerson && (
            <div className="property-lease-item">
              <div className="property-lease-label">Contact Person</div>
              <div className="property-lease-value">{tenant.contactPerson}</div>
            </div>
          )}
        </div>
        {/* Future: Add link to tenant details page */}
        {/*
        <div className="property-lease-footer">
          <a href={`/tenants/${tenant.id}`} className="property-lease-link">
            View Full Tenant Details →
          </a>
        </div>
        */}
      </div>
    </div>
  );
};

export default PropertyLeaseInfo;
