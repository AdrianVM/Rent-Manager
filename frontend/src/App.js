import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import authService from './services/authService';
import { Navigation } from './components/common';
import {
  Login,
  AdminDashboard,
  PropertyOwnerDashboard,
  RenterDashboard,
  Properties,
  Tenants,
  Payments
} from './pages';
import TenantOnboarding from './pages/TenantOnboarding';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated on app load
    if (authService.isAuthenticated()) {
      setUser(authService.getCurrentUser());
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: 'var(--bg-color)'
      }}>
        <div style={{ color: 'var(--text-primary)' }}>Loading...</div>
      </div>
    );
  }

  // Public routes that don't require authentication
  const publicRoutes = (
    <Router>
      <Routes>
        <Route path="/onboard" element={<TenantOnboarding />} />
        <Route path="*" element={<Login onLoginSuccess={handleLoginSuccess} />} />
      </Routes>
    </Router>
  );

  if (!user) {
    return publicRoutes;
  }

  const isRenter = user?.role?.toLowerCase() === 'renter';
  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const canAccessPropertyOwnerFeatures = isAdmin || user?.role?.toLowerCase() === 'propertyowner';


  return (
    <Router>
      <Routes>
        {/* Public route accessible even when logged in */}
        <Route path="/onboard" element={<TenantOnboarding />} />

        {/* Authenticated routes */}
        <Route path="/*" element={
          <div className="App">
            <Navigation user={user} onLogout={handleLogout} />
            <div className="container">
              <Routes>
                <Route
                  path="/"
                  element={
                    isRenter ? <RenterDashboard /> :
                    isAdmin ? <AdminDashboard /> :
                    <PropertyOwnerDashboard />
                  }
                />
                {canAccessPropertyOwnerFeatures && (
                  <>
                    <Route path="/properties" element={<Properties />} />
                    <Route path="/tenants" element={<Tenants />} />
                    <Route path="/payments" element={<Payments />} />
                  </>
                )}
              </Routes>
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;