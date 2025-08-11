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
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [payments, setPayments] = useState([]);
  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem('rentManager_userRole') || 'manager';
  });

  useEffect(() => {
    const storedProperties = localStorage.getItem('rentManager_properties');
    const storedTenants = localStorage.getItem('rentManager_tenants');
    const storedPayments = localStorage.getItem('rentManager_payments');

    if (storedProperties && JSON.parse(storedProperties).length > 0) {
      setProperties(JSON.parse(storedProperties));
    } else {
      // Initialize with mock data if no stored data exists
      const mockProperties = [
        {
          id: 'prop-001',
          name: 'Sunset Apartments - Unit 4B',
          address: '123 Sunset Boulevard, Los Angeles, CA 90210',
          type: 'apartment',
          bedrooms: 2,
          bathrooms: 2,
          rentAmount: 2500,
          status: 'occupied',
          description: 'Modern 2-bedroom apartment with city views, updated kitchen, and in-unit laundry.'
        },
        {
          id: 'prop-002',
          name: 'Downtown Luxury Condo',
          address: '456 Downtown Avenue, Unit 15A, Los Angeles, CA 90012',
          type: 'condo',
          bedrooms: 1,
          bathrooms: 1,
          rentAmount: 3200,
          status: 'occupied',
          description: 'High-rise luxury condo with panoramic city views, concierge service, and gym access.'
        },
        {
          id: 'prop-003',
          name: 'Family House on Oak Street',
          address: '789 Oak Street, Pasadena, CA 91101',
          type: 'house',
          bedrooms: 4,
          bathrooms: 3,
          rentAmount: 4500,
          status: 'occupied',
          description: 'Spacious family home with large backyard, 2-car garage, and excellent school district.'
        },
        {
          id: 'prop-004',
          name: 'Covered Parking Space - A12',
          address: '100 Business Plaza, Parking Level B1, Space A12',
          type: 'parking_space',
          parkingType: 'covered',
          spaceNumber: 'A12',
          rentAmount: 150,
          status: 'occupied',
          description: 'Secure covered parking space in downtown business district.'
        },
        {
          id: 'prop-005',
          name: 'Open Air Parking - B25',
          address: '200 Shopping Center, Outdoor Lot B, Space 25',
          type: 'parking_space',
          parkingType: 'open_air',
          spaceNumber: 'B25',
          rentAmount: 80,
          status: 'available',
          description: 'Convenient outdoor parking space near shopping center.'
        },
        {
          id: 'prop-006',
          name: 'Downtown Office Suite',
          address: '300 Corporate Drive, Suite 201, Los Angeles, CA 90015',
          type: 'commercial',
          squareFootage: 2500,
          rentAmount: 8000,
          status: 'occupied',
          description: 'Modern office space with conference rooms, reception area, and premium location.'
        },
        {
          id: 'prop-007',
          name: 'Retail Storefront',
          address: '400 Main Street, Unit 1, Santa Monica, CA 90401',
          type: 'commercial',
          squareFootage: 1200,
          rentAmount: 5500,
          status: 'available',
          description: 'Prime retail location with street-facing windows and high foot traffic.'
        },
        {
          id: 'prop-008',
          name: 'Garden Apartment - Unit 2C',
          address: '500 Garden View Drive, Unit 2C, Beverly Hills, CA 90210',
          type: 'apartment',
          bedrooms: 3,
          bathrooms: 2,
          rentAmount: 3800,
          status: 'occupied',
          description: 'Elegant garden apartment with private patio and premium amenities.'
        },
        {
          id: 'prop-009',
          name: 'Executive Townhouse',
          address: '600 Executive Way, Manhattan Beach, CA 90266',
          type: 'house',
          bedrooms: 3,
          bathrooms: 2.5,
          rentAmount: 5200,
          status: 'available',
          description: 'Luxury townhouse with ocean views, private garage, and beach access.'
        },
        {
          id: 'prop-010',
          name: 'Studio Apartment',
          address: '700 College Avenue, Unit 8, Westwood, CA 90024',
          type: 'apartment',
          bedrooms: 0,
          bathrooms: 1,
          rentAmount: 1800,
          status: 'occupied',
          description: 'Cozy studio apartment perfect for students, near UCLA campus.'
        }
      ];
      setProperties(mockProperties);
    }

    if (storedTenants && JSON.parse(storedTenants).length > 0) {
      setTenants(JSON.parse(storedTenants));
    } else {
      // Initialize with mock tenants
      const mockTenants = [
        {
          id: 'tenant-001',
          name: 'John Smith',
          email: 'john.smith@email.com',
          phone: '+1 (555) 123-4567',
          propertyId: 'prop-001',
          leaseStart: '2023-06-01',
          leaseEnd: '2024-05-31',
          rentAmount: 2500,
          deposit: 2500,
          status: 'active'
        },
        {
          id: 'tenant-002',
          name: 'Sarah Johnson',
          email: 'sarah.johnson@email.com',
          phone: '+1 (555) 234-5678',
          propertyId: 'prop-002',
          leaseStart: '2023-03-01',
          leaseEnd: '2024-02-28',
          rentAmount: 3200,
          deposit: 3200,
          status: 'active'
        },
        {
          id: 'tenant-003',
          name: 'Michael Davis Family',
          email: 'michael.davis@email.com',
          phone: '+1 (555) 345-6789',
          propertyId: 'prop-003',
          leaseStart: '2023-08-01',
          leaseEnd: '2024-07-31',
          rentAmount: 4500,
          deposit: 4500,
          status: 'active'
        },
        {
          id: 'tenant-004',
          name: 'Corporate Parking LLC',
          email: 'parking@corporate.com',
          phone: '+1 (555) 456-7890',
          propertyId: 'prop-004',
          leaseStart: '2023-01-01',
          leaseEnd: '2023-12-31',
          rentAmount: 150,
          deposit: 300,
          status: 'active'
        },
        {
          id: 'tenant-005',
          name: 'TechCorp Solutions',
          email: 'facilities@techcorp.com',
          phone: '+1 (555) 567-8901',
          propertyId: 'prop-006',
          leaseStart: '2022-10-01',
          leaseEnd: '2025-09-30',
          rentAmount: 8000,
          deposit: 16000,
          status: 'active'
        },
        {
          id: 'tenant-006',
          name: 'Emily Rodriguez',
          email: 'emily.rodriguez@email.com',
          phone: '+1 (555) 678-9012',
          propertyId: 'prop-008',
          leaseStart: '2023-04-01',
          leaseEnd: '2024-03-31',
          rentAmount: 3800,
          deposit: 3800,
          status: 'active'
        },
        {
          id: 'tenant-007',
          name: 'Alex Chen',
          email: 'alex.chen@student.ucla.edu',
          phone: '+1 (555) 789-0123',
          propertyId: 'prop-010',
          leaseStart: '2023-09-01',
          leaseEnd: '2024-06-30',
          rentAmount: 1800,
          deposit: 1800,
          status: 'active'
        }
      ];
      setTenants(mockTenants);
    }

    if (storedPayments && JSON.parse(storedPayments).length > 0) {
      setPayments(JSON.parse(storedPayments));
    } else {
      // Initialize with mock payments
      const mockPayments = [
        // John Smith payments (prop-001)
        {
          id: 'pay-001',
          tenantId: 'tenant-001',
          amount: 2500,
          date: '2024-01-01',
          method: 'bank_transfer',
          status: 'completed',
          notes: 'January rent payment'
        },
        {
          id: 'pay-002',
          tenantId: 'tenant-001',
          amount: 2500,
          date: '2023-12-01',
          method: 'check',
          status: 'completed',
          notes: 'December rent payment'
        },
        {
          id: 'pay-003',
          tenantId: 'tenant-001',
          amount: 2500,
          date: '2023-11-01',
          method: 'online',
          status: 'completed',
          notes: 'November rent payment'
        },
        // Sarah Johnson payments (prop-002)
        {
          id: 'pay-004',
          tenantId: 'tenant-002',
          amount: 3200,
          date: '2024-01-01',
          method: 'bank_transfer',
          status: 'completed',
          notes: 'January rent payment'
        },
        {
          id: 'pay-005',
          tenantId: 'tenant-002',
          amount: 3200,
          date: '2023-12-01',
          method: 'online',
          status: 'completed',
          notes: 'December rent payment'
        },
        // Michael Davis payments (prop-003)
        {
          id: 'pay-006',
          tenantId: 'tenant-003',
          amount: 4500,
          date: '2024-01-01',
          method: 'bank_transfer',
          status: 'completed',
          notes: 'January rent payment'
        },
        {
          id: 'pay-007',
          tenantId: 'tenant-003',
          amount: 4500,
          date: '2023-12-01',
          method: 'check',
          status: 'completed',
          notes: 'December rent payment'
        },
        {
          id: 'pay-008',
          tenantId: 'tenant-003',
          amount: 4500,
          date: '2023-11-01',
          method: 'bank_transfer',
          status: 'completed',
          notes: 'November rent payment'
        },
        // Corporate Parking payments (prop-004)
        {
          id: 'pay-009',
          tenantId: 'tenant-004',
          amount: 150,
          date: '2024-01-01',
          method: 'bank_transfer',
          status: 'completed',
          notes: 'January parking fee'
        },
        {
          id: 'pay-010',
          tenantId: 'tenant-004',
          amount: 150,
          date: '2023-12-01',
          method: 'bank_transfer',
          status: 'completed',
          notes: 'December parking fee'
        },
        // TechCorp payments (prop-006)
        {
          id: 'pay-011',
          tenantId: 'tenant-005',
          amount: 8000,
          date: '2024-01-01',
          method: 'bank_transfer',
          status: 'completed',
          notes: 'January office rent'
        },
        {
          id: 'pay-012',
          tenantId: 'tenant-005',
          amount: 8000,
          date: '2023-12-01',
          method: 'bank_transfer',
          status: 'completed',
          notes: 'December office rent'
        },
        {
          id: 'pay-013',
          tenantId: 'tenant-005',
          amount: 8000,
          date: '2023-11-01',
          method: 'bank_transfer',
          status: 'completed',
          notes: 'November office rent'
        },
        // Emily Rodriguez payments (prop-008)
        {
          id: 'pay-014',
          tenantId: 'tenant-006',
          amount: 3800,
          date: '2024-01-01',
          method: 'online',
          status: 'completed',
          notes: 'January rent payment'
        },
        {
          id: 'pay-015',
          tenantId: 'tenant-006',
          amount: 3800,
          date: '2023-12-01',
          method: 'online',
          status: 'completed',
          notes: 'December rent payment'
        },
        // Alex Chen payments (prop-010)
        {
          id: 'pay-016',
          tenantId: 'tenant-007',
          amount: 1800,
          date: '2024-01-01',
          method: 'bank_transfer',
          status: 'completed',
          notes: 'January rent payment'
        },
        {
          id: 'pay-017',
          tenantId: 'tenant-007',
          amount: 1800,
          date: '2023-12-01',
          method: 'bank_transfer',
          status: 'completed',
          notes: 'December rent payment'
        },
        {
          id: 'pay-018',
          tenantId: 'tenant-007',
          amount: 1800,
          date: '2023-11-01',
          method: 'online',
          status: 'completed',
          notes: 'November rent payment'
        },
        // Some pending/late payments for realism
        {
          id: 'pay-019',
          tenantId: 'tenant-002',
          amount: 1600,
          date: '2024-02-01',
          method: 'online',
          status: 'completed',
          notes: 'Partial February payment'
        },
        {
          id: 'pay-020',
          tenantId: 'tenant-003',
          amount: 4500,
          date: '2024-02-05',
          method: 'check',
          status: 'pending',
          notes: 'February rent payment - check processing'
        }
      ];
      setPayments(mockPayments);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('rentManager_properties', JSON.stringify(properties));
  }, [properties]);

  useEffect(() => {
    localStorage.setItem('rentManager_tenants', JSON.stringify(tenants));
  }, [tenants]);

  useEffect(() => {
    localStorage.setItem('rentManager_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('rentManager_userRole', userRole);
  }, [userRole]);

  const appData = {
    properties,
    setProperties,
    tenants,
    setTenants,
    payments,
    setPayments
  };

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
                  ? <Dashboard {...appData} /> 
                  : <RenterDashboard {...appData} />
              } 
            />
            {userRole === 'manager' && (
              <>
                <Route path="/properties" element={<Properties {...appData} />} />
                <Route path="/tenants" element={<Tenants {...appData} />} />
                <Route path="/payments" element={<Payments {...appData} />} />
              </>
            )}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;