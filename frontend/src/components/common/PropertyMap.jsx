import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './PropertyMap.css';

// Fix for default marker icon in react-leaflet
// Using CDN URLs for better compatibility
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

/**
 * PropertyMap Component
 *
 * A reusable map component that displays a property's location on an interactive map.
 * Automatically geocodes the property address to get coordinates.
 *
 * @param {Object} property - Property object containing name and address
 * @param {boolean} showAddressOverlay - Whether to show the glassmorphism address overlay (default: true)
 * @param {number} height - Map height in pixels (default: 400)
 * @param {number} zoom - Map zoom level (default: 15)
 * @param {boolean} scrollWheelZoom - Enable scroll wheel zoom (default: false)
 */
function PropertyMap({
  property,
  showAddressOverlay = true,
  height = 400,
  zoom = 15,
  scrollWheelZoom = false
}) {
  const [coordinates, setCoordinates] = useState(null);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (property && property.address) {
      geocodeAddress(property.address);
    }
  }, [property]);

  const geocodeAddress = async (address) => {
    try {
      setGeocoding(true);
      setError(false);

      // Using Nominatim API for OpenStreetMap geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        setCoordinates({
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        });
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Error geocoding address:', err);
      setError(true);
    } finally {
      setGeocoding(false);
    }
  };

  if (!property || !property.address) {
    return null;
  }

  // Loading state
  if (geocoding) {
    return (
      <div className="property-map-loading">
        <div className="property-map-spinner"></div>
        <p>Loading map...</p>
      </div>
    );
  }

  // Error state
  if (error || !coordinates) {
    return (
      <div className="property-map-error">
        <p>Unable to display map for this address</p>
        <p className="property-map-error-address">{property.address}</p>
      </div>
    );
  }

  return (
    <div className="property-map-container" style={{ height: `${height}px` }}>
      <MapContainer
        center={[coordinates.lat, coordinates.lng]}
        zoom={zoom}
        scrollWheelZoom={scrollWheelZoom}
        style={{ height: '100%', width: '100%' }}
        className="property-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[coordinates.lat, coordinates.lng]}>
          <Popup>
            <div className="property-map-popup">
              <strong>{property.name}</strong>
              <br />
              {property.address}
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {showAddressOverlay && (
        <div className="property-map-address-overlay">
          <div className="property-map-address-icon">📍</div>
          <div className="property-map-address-text">
            <div className="property-map-address-label">Location</div>
            <div className="property-map-address-value">{property.address}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PropertyMap;
