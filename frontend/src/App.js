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
import AuthCallback from './pages/AuthCallback';
import Logout from './pages/Logout';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize auth service and check if user is already authenticated
    const initAuth = async () => {
      await authService.init();
      if (authService.isAuthenticated()) {
        setUser(authService.getCurrentUser());
      }
      setLoading(false);
    };

    initAuth();
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
        backgroundColor: 'var(--bg-secondary)'
      }}>
        <div style={{ color: 'var(--text-primary)' }}>Loading...</div>
      </div>
    );
  }

  // Public routes that don't require authentication
  const publicRoutes = (
    <Router>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback onAuthSuccess={handleLoginSuccess} />} />
        <Route path="/logout" element={<Logout />} />
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
        {/* OAuth callback route */}
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Logout route */}
        <Route path="/logout" element={<Logout />} />

        {/* Public route accessible even when logged in */}
        <Route path="/onboard" element={<TenantOnboarding />} />

        {/* Authenticated routes */}
        <Route path="/*" element={
          <div className="App">
            <Navigation user={user} onLogout={handleLogout} />
            <div className="container">
              <Routes>
                {/* Role-based dashboard routes */}
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/owner/dashboard" element={<PropertyOwnerDashboard />} />
                <Route path="/tenant/dashboard" element={<RenterDashboard />} />

                {/* Default route - redirect to appropriate dashboard */}
                <Route
                  path="/"
                  element={
                    isRenter ? <RenterDashboard /> :
                    isAdmin ? <AdminDashboard /> :
                    <PropertyOwnerDashboard />
                  }
                />

                {/* Feature routes - only accessible by property owners and admins */}
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