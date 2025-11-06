import React from 'react';

const PropertyOverviewCard = ({ property }) => {
  // Get icon based on property type
  const getPropertyIcon = (type) => {
    switch (type) {
      case 'apartment':
        return '🏢';
      case 'house':
        return '🏠';
      case 'condo':
        return '🏘️';
      case 'commercial':
        return '🏪';
      case 'parkingSpace':
        return '🅿️';
      default:
        return '🏢';
    }
  };

  // Format property type for display
  const formatPropertyType = (type) => {
    return type.replace(/([A-Z])/g, ' $1').trim();
  };

  return (
    <div className="property-view-section">
      <div className="property-overview-card">
        <div className="property-overview-icon">
          {getPropertyIcon(property.type)}
        </div>
        <div className="property-overview-content">
          <h1 className="property-overview-name">{property.name}</h1>
          <div className="property-overview-address">
            <span className="property-overview-location-icon">📍</span>
            <span>{property.address}</span>
          </div>
          <div className="property-overview-type">
            <span className="property-type-badge">
              {formatPropertyType(property.type)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyOverviewCard;
