import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useTheme } from './contexts/ThemeContext';
import Dashboard from './components/Dashboard';
import RenterDashboard from './components/RenterDashboard';
import Properties from './components/Properties';
import Tenants from './components/Tenants';
import Payments from './components/Payments';

function Navigation({ userRole, setUserRole }) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  
  return (
    <nav className="nav">
      <div className="container">
        <div className="nav-header">
          <Link to="/" className="nav-brand">
            <span className="brand-logo">AVM</span>
            <span className="brand-text">Property Management</span>
          </Link>
          <div className="nav-desktop">
            <ul className="nav-links">
              <li><Link to="/" className={location.pathname === '/' ? 'active' : ''}>Dashboard</Link></li>
              {userRole === 'manager' && (
                <>
                  <li><Link to="/properties" className={location.pathname === '/properties' ? 'active' : ''}>Properties</Link></li>
                  <li><Link to="/tenants" className={location.pathname === '/tenants' ? 'active' : ''}>Tenants</Link></li>
                  <li><Link to="/payments" className={location.pathname === '/payments' ? 'active' : ''}>Payments</Link></li>
                </>
              )}
              <li>
                <button 
                  onClick={() => setUserRole(userRole === 'manager' ? 'renter' : 'manager')}
                  className="btn-secondary"
                  style={{ 
                    padding: '6px 12px', 
                    fontSize: '12px', 
                    marginRight: '10px',
                    borderRadius: '6px'
                  }}
                >
                  Switch to {userRole === 'manager' ? 'Renter' : 'Manager'}
                </button>
              </li>
              <li>
                <button onClick={toggleTheme} className="theme-toggle" title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
                  <span className="theme-icon">{theme === 'light' ? '🌙' : '☀️'}</span>
                  <span className="theme-text">{theme === 'light' ? 'Dark' : 'Light'}</span>
                </button>
              </li>
            </ul>
          </div>
          <button 
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="nav-mobile">
            <ul className="nav-links-mobile">
              <li><Link to="/" className={location.pathname === '/' ? 'active' : ''} onClick={() => setMobileMenuOpen(false)}>Dashboard</Link></li>
              {userRole === 'manager' && (
                <>
                  <li><Link to="/properties" className={location.pathname === '/properties' ? 'active' : ''} onClick={() => setMobileMenuOpen(false)}>Properties</Link></li>
                  <li><Link to="/tenants" className={location.pathname === '/tenants' ? 'active' : ''} onClick={() => setMobileMenuOpen(false)}>Tenants</Link></li>
                  <li><Link to="/payments" className={location.pathname === '/payments' ? 'active' : ''} onClick={() => setMobileMenuOpen(false)}>Payments</Link></li>
                </>
              )}
              <li>
                <button 
                  onClick={() => {
                    setUserRole(userRole === 'manager' ? 'renter' : 'manager');
                    setMobileMenuOpen(false);
                  }}
                  className="theme-toggle-mobile"
                  style={{ backgroundColor: 'var(--secondary-color)', marginBottom: '10px' }}
                >
                  Switch to {userRole === 'manager' ? 'Renter' : 'Manager'}
                </button>
              </li>
              <li>
                <button onClick={toggleTheme} className="theme-toggle-mobile">
                  <span className="theme-icon">{theme === 'light' ? '🌙' : '☀️'}</span>
                  {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
}

function App() {
  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem('rentManager_userRole') || 'manager';
  });

  useEffect(() => {
    localStorage.setItem('rentManager_userRole', userRole);
  }, [userRole]);

  return (
    <Router>
      <div className="App">
        <Navigation userRole={userRole} setUserRole={setUserRole} />
        <div className="container">
          <Routes>
            <Route 
              path="/" 
              element={
                userRole === 'manager' 
                  ? <Dashboard /> 
                  : <RenterDashboard />
              } 
            />
            {userRole === 'manager' && (
              <>
                <Route path="/properties" element={<Properties />} />
                <Route path="/tenants" element={<Tenants />} />
                <Route path="/payments" element={<Payments />} />
              </>
            )}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;