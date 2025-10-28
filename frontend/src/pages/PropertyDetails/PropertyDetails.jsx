import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import apiService from '../../services/api';
import './PropertyDetails.css';

// Fix for default marker icon in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function PropertyDetails() {
  const [property, setProperty] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coordinates, setCoordinates] = useState(null);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    loadPropertyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPropertyData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user's tenant info
      const tenantsData = await apiService.getTenants();
      const activeTenant = tenantsData.find(t => t.status?.toLowerCase() === 'active');

      if (!activeTenant) {
        setError('No active rental found. Please contact your property manager.');
        setLoading(false);
        return;
      }

      setTenant(activeTenant);

      // Get property details
      if (activeTenant.propertyId) {
        const propertyData = await apiService.getProperty(activeTenant.propertyId);
        setProperty(propertyData);

        // Geocode the address
        if (propertyData.address) {
          await geocodeAddress(propertyData.address);
        }
      } else {
        setError('No property assigned to your account.');
      }
    } catch (err) {
      console.error('Error loading property data:', err);
      setError('Failed to load property information');
    } finally {
      setLoading(false);
    }
  };

  const geocodeAddress = async (address) => {
    try {
      setGeocoding(true);
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
      }
    } catch (err) {
      console.error('Error geocoding address:', err);
    } finally {
      setGeocoding(false);
    }
  };

  const getPropertyTypeIcon = (type) => {
    const typeConfig = {
      apartment: '🏢',
      house: '🏠',
      condo: '🏘️',
      commercial: '🏪',
      parkingspace: '🅿️',
    };
    return typeConfig[type?.toLowerCase().replace(/\s/g, '')] || '🏘️';
  };

  const formatPropertyType = (type) => {
    return type
      .replace(/([A-Z])/g, ' $1')
      .replace(/^\w/, c => c.toUpperCase())
      .trim();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="property-details-page">
        <div className="property-details-header">
          <h1 className="property-details-title">My Rental</h1>
        </div>
        <div className="property-details-loading">
          <div className="loading-spinner"></div>
          <p>Loading your property information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="property-details-page">
        <div className="property-details-header">
          <h1 className="property-details-title">My Rental</h1>
        </div>
        <div className="property-details-error">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadPropertyData}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="property-details-page">
        <div className="property-details-header">
          <h1 className="property-details-title">My Rental</h1>
        </div>
        <div className="property-details-error">
          <div className="error-icon">🏠</div>
          <p>No property information available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="property-details-page">
      <div className="property-details-header">
        <div>
          <h1 className="property-details-title">My Rental</h1>
          <p className="property-details-subtitle">
            View your current rental property details and location
          </p>
        </div>
      </div>

      {/* Property Overview Card */}
      <div className="property-overview-card">
        <div className="property-icon-large">
          {getPropertyTypeIcon(property.type)}
        </div>
        <div className="property-overview-content">
          <h2 className="property-name">{property.name}</h2>
          <p className="property-address">📍 {property.address}</p>
          <div className="property-type-badge">
            {formatPropertyType(property.type)}
          </div>
        </div>
      </div>

      {/* Property Details Grid */}
      <div className="property-details-grid">
        <div className="detail-card">
          <div className="detail-icon">💰</div>
          <div className="detail-content">
            <div className="detail-label">Monthly Rent</div>
            <div className="detail-value">{formatCurrency(property.rentAmount)}</div>
          </div>
        </div>

        {property.bedrooms && (
          <div className="detail-card">
            <div className="detail-icon">🛏️</div>
            <div className="detail-content">
              <div className="detail-label">Bedrooms</div>
              <div className="detail-value">{property.bedrooms}</div>
            </div>
          </div>
        )}

        {property.bathrooms && (
          <div className="detail-card">
            <div className="detail-icon">🚿</div>
            <div className="detail-content">
              <div className="detail-label">Bathrooms</div>
              <div className="detail-value">{property.bathrooms}</div>
            </div>
          </div>
        )}

        {property.squareFootage && (
          <div className="detail-card">
            <div className="detail-icon">📏</div>
            <div className="detail-content">
              <div className="detail-label">Square Footage</div>
              <div className="detail-value">{property.squareFootage.toLocaleString()} sq ft</div>
            </div>
          </div>
        )}

        {property.parkingType && (
          <div className="detail-card">
            <div className="detail-icon">🚗</div>
            <div className="detail-content">
              <div className="detail-label">Parking</div>
              <div className="detail-value">{formatPropertyType(property.parkingType)}</div>
            </div>
          </div>
        )}

        {property.spaceNumber && (
          <div className="detail-card">
            <div className="detail-icon">🔢</div>
            <div className="detail-content">
              <div className="detail-label">Space Number</div>
              <div className="detail-value">{property.spaceNumber}</div>
            </div>
          </div>
        )}
      </div>

      {/* Description Section */}
      {property.description && (
        <div className="property-description-card">
          <h3 className="section-title">Description</h3>
          <p className="property-description">{property.description}</p>
        </div>
      )}

      {/* Lease Information */}
      {tenant && (
        <div className="lease-info-card">
          <h3 className="section-title">Lease Information</h3>
          <div className="lease-info-grid">
            <div className="lease-info-item">
              <span className="info-label">Lease Start:</span>
              <span className="info-value">
                {new Date(tenant.leaseStart).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <div className="lease-info-item">
              <span className="info-label">Lease End:</span>
              <span className="info-value">
                {new Date(tenant.leaseEnd).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <div className="lease-info-item">
              <span className="info-label">Status:</span>
              <span className={`info-value status-${tenant.status?.toLowerCase()}`}>
                {tenant.status}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Map Section */}
      <div className="property-map-card">
        <h3 className="section-title">Location</h3>
        {geocoding && (
          <div className="map-loading">
            <div className="loading-spinner"></div>
            <p>Loading map...</p>
          </div>
        )}
        {!geocoding && coordinates ? (
          <div className="map-container">
            <MapContainer
              center={[coordinates.lat, coordinates.lng]}
              zoom={15}
              style={{ height: '400px', width: '100%', borderRadius: 'var(--radius-lg)' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[coordinates.lat, coordinates.lng]}>
                <Popup>
                  <strong>{property.name}</strong>
                  <br />
                  {property.address}
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        ) : !geocoding && !coordinates ? (
          <div className="map-error">
            <p>Unable to display map for this address</p>
            <p className="map-error-address">{property.address}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default PropertyDetails;
