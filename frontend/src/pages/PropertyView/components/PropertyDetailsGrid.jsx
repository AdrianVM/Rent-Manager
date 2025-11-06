import React from 'react';

const PropertyDetailsGrid = ({ property }) => {
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Format parking type for display
  const formatParkingType = (type) => {
    return type.replace(/([A-Z])/g, ' $1').trim();
  };

  // Determine which details to show based on property type
  const renderDetails = () => {
    const details = [];

    // Monthly Rent - shown for all properties
    details.push(
      <div key="rent" className="property-detail-card">
        <div className="property-detail-icon">💰</div>
        <div className="property-detail-content">
          <div className="property-detail-label">Monthly Rent</div>
          <div className="property-detail-value">{formatCurrency(property.rentAmount)}</div>
        </div>
      </div>
    );

    // Residential properties: Bedrooms and Bathrooms
    if (['apartment', 'house', 'condo'].includes(property.type)) {
      details.push(
        <div key="bedrooms" className="property-detail-card">
          <div className="property-detail-icon">🛏️</div>
          <div className="property-detail-content">
            <div className="property-detail-label">Bedrooms</div>
            <div className="property-detail-value">{property.bedrooms || 0}</div>
          </div>
        </div>
      );

      details.push(
        <div key="bathrooms" className="property-detail-card">
          <div className="property-detail-icon">🚿</div>
          <div className="property-detail-content">
            <div className="property-detail-label">Bathrooms</div>
            <div className="property-detail-value">{property.bathrooms || 0}</div>
          </div>
        </div>
      );
    }

    // Commercial properties: Square Footage
    if (property.type === 'commercial' && property.squareFootage) {
      details.push(
        <div key="sqft" className="property-detail-card">
          <div className="property-detail-icon">📏</div>
          <div className="property-detail-content">
            <div className="property-detail-label">Square Footage</div>
            <div className="property-detail-value">
              {property.squareFootage.toLocaleString()} sq ft
            </div>
          </div>
        </div>
      );
    }

    // Parking spaces: Parking Type and Space Number
    if (property.type === 'parkingSpace') {
      if (property.parkingType) {
        details.push(
          <div key="parking-type" className="property-detail-card">
            <div className="property-detail-icon">🚗</div>
            <div className="property-detail-content">
              <div className="property-detail-label">Parking Type</div>
              <div className="property-detail-value">
                {formatParkingType(property.parkingType)}
              </div>
            </div>
          </div>
        );
      }

      if (property.spaceNumber) {
        details.push(
          <div key="space-number" className="property-detail-card">
            <div className="property-detail-icon">🔢</div>
            <div className="property-detail-content">
              <div className="property-detail-label">Space Number</div>
              <div className="property-detail-value">{property.spaceNumber}</div>
            </div>
          </div>
        );
      }
    }

    return details;
  };

  return (
    <div className="property-view-section">
      <div className="property-details-grid">
        {renderDetails()}
      </div>
    </div>
  );
};

export default PropertyDetailsGrid;
