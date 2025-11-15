import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import authService from './services/authService';
import cookieConsentService from './services/cookieConsentService';
import { Navigation, MainContent } from './components/common';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import CookieBanner from './components/CookieConsent/CookieBanner';
import CookiePreferences from './components/CookieConsent/CookiePreferences';
import {
  Login,
  AdminDashboard,
  PropertyOwnerDashboard,
  RenterDashboard,
  Properties,
  PropertyView,
  Tenants,
  Payments,
  UserManagement,
  SystemSettings,
  MaintenanceRequests,
  Documents,
  PaymentHistory,
  PropertyDetails,
  LogoShowcase,
  Reports,
  IncomeStatement,
  RentCollection,
  CashFlow,
  OccupancyRevenue
} from './pages';
import CookiePolicy from './pages/CookiePolicy/CookiePolicy';
import PrivacyPolicyPage from './pages/PrivacyPolicy/PrivacyPolicyPage';
import DataSubjectRequestPage from './pages/DataRequests/DataSubjectRequestPage';
import TenantOnboarding from './pages/TenantOnboarding';
import AuthCallback from './pages/AuthCallback';
import Logout from './pages/Logout';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [currentRole, setCurrentRole] = useState(null);
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const [showCookiePreferences, setShowCookiePreferences] = useState(false);

  useEffect(() => {
    // Initialize auth service and check if user is already authenticated
    const initAuth = async () => {
      await authService.init();
      if (authService.isAuthenticated()) {
        const userData = authService.getCurrentUser();
        const roles = authService.getAllUserRoles();
        setUser(userData);
        setAvailableRoles(roles);

        // Check if there's a saved active role preference
        const savedRole = localStorage.getItem('activeRole');
        if (savedRole && roles.includes(savedRole)) {
          setCurrentRole(savedRole);
        } else {
          // Default to user's primary role
          setCurrentRole(userData.role);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  useEffect(() => {
    // Check if cookie consent banner should be shown
    const checkCookieConsent = () => {
      if (cookieConsentService.shouldShowBanner()) {
        setShowCookieBanner(true);
      }
    };

    // Delay showing banner slightly to not interrupt initial page load
    const timer = setTimeout(checkCookieConsent, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleLoginSuccess = (userData) => {
    const roles = authService.getAllUserRoles();
    setUser(userData);
    setAvailableRoles(roles);
    setCurrentRole(userData.role);
    localStorage.setItem('activeRole', userData.role);
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    setAvailableRoles([]);
    setCurrentRole(null);
    localStorage.removeItem('activeRole');
  };

  const handleRoleChange = (newRole) => {
    setCurrentRole(newRole);
    localStorage.setItem('activeRole', newRole);
  };

  const handleAcceptAllCookies = async () => {
    try {
      await cookieConsentService.acceptAll();
      setShowCookieBanner(false);
    } catch (error) {
      console.error('Error accepting cookies:', error);
    }
  };

  const handleAcceptNecessaryOnly = async () => {
    try {
      await cookieConsentService.acceptNecessaryOnly();
      setShowCookieBanner(false);
    } catch (error) {
      console.error('Error accepting necessary cookies:', error);
    }
  };

  const handleCustomizeCookies = () => {
    setShowCookieBanner(false);
    setShowCookiePreferences(true);
  };

  const handleCookiePreferencesSaved = () => {
    setShowCookiePreferences(false);
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading-text">Loading...</div>
      </div>
    );
  }

  // Public routes that don't require authentication
  const publicRoutes = (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback onAuthSuccess={handleLoginSuccess} />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/onboard" element={<TenantOnboarding />} />
          <Route path="/logo-showcase" element={<LogoShowcase />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="*" element={<Login onLoginSuccess={handleLoginSuccess} />} />
        </Routes>
        <Footer />
        {showCookieBanner && (
          <CookieBanner
            onAcceptAll={handleAcceptAllCookies}
            onAcceptNecessary={handleAcceptNecessaryOnly}
            onCustomize={handleCustomizeCookies}
            onClose={() => setShowCookieBanner(false)}
          />
        )}
        {showCookiePreferences && (
          <CookiePreferences
            onSave={handleCookiePreferencesSaved}
            onClose={() => setShowCookiePreferences(false)}
          />
        )}
      </div>
    </Router>
  );

  if (!user) {
    return publicRoutes;
  }

  const activeRole = currentRole || user?.role;
  const isRenter = activeRole?.toLowerCase() === 'renter';
  const isAdmin = activeRole?.toLowerCase() === 'admin';
  const isPropertyOwner = activeRole?.toLowerCase() === 'propertyowner';
  const canAccessPropertyOwnerFeatures = isAdmin || isPropertyOwner;

  return (
    <Router>
      <Routes>
        {/* OAuth callback route */}
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Logout route */}
        <Route path="/logout" element={<Logout />} />

        {/* Public routes accessible even when logged in */}
        <Route path="/onboard" element={<TenantOnboarding />} />
        <Route path="/logo-showcase" element={<LogoShowcase />} />
        <Route path="/cookie-policy" element={<CookiePolicy />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

        {/* Authenticated routes */}
        <Route path="/*" element={
          <div className="App">
            <Navigation
              user={user}
              availableRoles={availableRoles}
              currentRole={activeRole}
              onRoleChange={handleRoleChange}
              onLogout={handleLogout}
            />
            <Sidebar
              user={user}
              currentRole={activeRole}
            />
            <div className="app-layout">
              <MainContent>
                <Routes>
                  {/* Role-based dashboard routes */}
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/owner/dashboard" element={<PropertyOwnerDashboard />} />
                  <Route path="/tenant/dashboard" element={<RenterDashboard />} />

                  {/* Default route - redirect to appropriate dashboard based on active role */}
                  <Route
                    path="/"
                    element={
                      isRenter ? <RenterDashboard /> :
                      isAdmin ? <AdminDashboard /> :
                      isPropertyOwner ? <PropertyOwnerDashboard /> :
                      <RenterDashboard />
                    }
                  />

                  {/* Renter-specific routes */}
                  {isRenter && (
                    <>
                      <Route path="/my-rental" element={<PropertyDetails />} />
                      <Route path="/maintenance" element={<MaintenanceRequests />} />
                      <Route path="/documents" element={<Documents />} />
                      <Route path="/payment-history" element={<PaymentHistory />} />
                    </>
                  )}

                  {/* Feature routes - only accessible by property owners and admins */}
                  {canAccessPropertyOwnerFeatures && (
                    <>
                      <Route path="/properties" element={<Properties />} />
                      <Route path="/properties/:id/view" element={<PropertyView />} />
                      <Route path="/tenants" element={<Tenants />} />
                      <Route path="/payments" element={<Payments />} />

                      {/* Financial Reports */}
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/reports/income-statement" element={<IncomeStatement />} />
                      <Route path="/reports/rent-collection" element={<RentCollection />} />
                      <Route path="/reports/cash-flow" element={<CashFlow />} />
                      <Route path="/reports/occupancy-revenue" element={<OccupancyRevenue />} />
                    </>
                  )}

                  {/* Privacy and Data Requests - Available to all authenticated users */}
                  <Route path="/data-requests" element={<DataSubjectRequestPage />} />

                  {/* Admin-only routes */}
                  {isAdmin && (
                    <>
                      <Route path="/user-management" element={<UserManagement />} />
                      <Route path="/system-settings" element={<SystemSettings />} />
                    </>
                  )}
                </Routes>
              </MainContent>
              <Footer />
            </div>
            {showCookieBanner && (
              <CookieBanner
                onAcceptAll={handleAcceptAllCookies}
                onAcceptNecessary={handleAcceptNecessaryOnly}
                onCustomize={handleCustomizeCookies}
                onClose={() => setShowCookieBanner(false)}
              />
            )}
            {showCookiePreferences && (
              <CookiePreferences
                onSave={handleCookiePreferencesSaved}
                onClose={() => setShowCookiePreferences(false)}
              />
            )}
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;