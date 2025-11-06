import React from 'react';
import { PropertyMap } from '../../../components/common';

/**
 * PropertyLocationMap - Wrapper component for PropertyView page
 * Uses the shared PropertyMap component with custom configuration
 */
function PropertyLocationMap({ property }) {
  return (
    <PropertyMap
      property={property}
      showAddressOverlay={true}
      height={400}
      zoom={15}
      scrollWheelZoom={false}
    />
  );
}

export default PropertyLocationMap;
