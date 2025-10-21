import zitadelAuthService from './zitadelAuth';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5057/api';

class AuthService {
  constructor() {
    this.token = localStorage.getItem('authToken');
    this.user = null;
    this.authMethod = localStorage.getItem('authMethod') || 'local'; // 'local' or 'zitadel'

    // Load user data from localStorage if token exists
    if (this.token) {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          this.user = JSON.parse(storedUser);
        } catch (error) {
          console.error('Error parsing stored user:', error);
          this.logout(); // Clear invalid data
        }
      }
    }
  }

  // Initialize - check for Zitadel auth
  async init() {
    try {
      await zitadelAuthService.init();

      if (zitadelAuthService.isAuthenticated()) {
        const profile = zitadelAuthService.getProfile();
        this.user = profile;
        this.authMethod = 'zitadel';
        localStorage.setItem('authMethod', 'zitadel');
        localStorage.setItem('currentUser', JSON.stringify(profile));
        return profile;
      }

      return this.user;
    } catch (error) {
      console.error('Auth init error:', error);
      return null;
    }
  }

  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      this.token = data.token;
      this.user = data.user;
      this.authMethod = 'local';

      localStorage.setItem('authToken', this.token);
      localStorage.setItem('currentUser', JSON.stringify(this.user));
      localStorage.setItem('authMethod', 'local');

      return { success: true, user: this.user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }

  async register(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const user = await response.json();
      return { success: true, user };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  }

  // Zitadel OAuth login
  async loginWithZitadel() {
    try {
      await zitadelAuthService.signin();
    } catch (error) {
      console.error('Zitadel login error:', error);
      return { success: false, error: error.message };
    }
  }

  async logout() {
    // Handle Zitadel logout
    if (this.authMethod === 'zitadel') {
      try {
        await zitadelAuthService.signout();
      } catch (error) {
        console.error('Zitadel logout error:', error);
      }
    }

    // Call backend logout endpoint if we have a token
    if (this.token && this.authMethod === 'local') {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
        });
      } catch (error) {
        console.error('Logout error:', error);
        // Continue with local cleanup even if server call fails
      }
    }

    // Clear local storage and memory
    this.token = null;
    this.user = null;
    this.authMethod = 'local';
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authMethod');
    localStorage.removeItem('rentManager_userRole'); // Remove old role storage
  }

  isAuthenticated() {
    if (this.authMethod === 'zitadel') {
      return zitadelAuthService.isAuthenticated();
    }
    return !!this.token && !!this.user;
  }

  getCurrentUser() {
    // Check if using Zitadel auth
    if (zitadelAuthService.isAuthenticated()) {
      this.authMethod = 'zitadel';
      return zitadelAuthService.getProfile();
    }

    if (this.authMethod === 'zitadel') {
      return zitadelAuthService.getProfile();
    }

    if (!this.user && this.token) {
      // Try to get user from localStorage if not in memory
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        this.user = JSON.parse(storedUser);
      }
    }
    return this.user;
  }

  getToken() {
    // Check if using Zitadel auth
    if (zitadelAuthService.isAuthenticated()) {
      this.authMethod = 'zitadel';
      return zitadelAuthService.getAccessToken();
    }

    if (this.authMethod === 'zitadel') {
      return zitadelAuthService.getAccessToken();
    }

    return this.token;
  }

  hasRole(role) {
    return this.user?.role?.toLowerCase() === role.toLowerCase();
  }

  canAccessAdminFeatures() {
    return this.hasRole('Admin');
  }

  canAccessPropertyOwnerFeatures() {
    return this.hasRole('Admin') || this.hasRole('PropertyOwner');
  }

  canAccessRenterFeatures() {
    return this.hasRole('Admin') || this.hasRole('PropertyOwner') || this.hasRole('Renter');
  }


  // Get authorization headers for API calls
  getAuthHeaders() {
    if (this.authMethod === 'zitadel') {
      return zitadelAuthService.getAuthHeaders();
    }

    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  // Get auth method
  getAuthMethod() {
    return this.authMethod;
  }

  // Get dashboard path based on user role
  getDashboardPath() {
    if (this.authMethod === 'zitadel') {
      return zitadelAuthService.getDashboardPath();
    }

    // For local auth, determine dashboard based on user role
    const user = this.getCurrentUser();
    if (!user || !user.role) {
      return '/';
    }

    switch (user.role) {
      case 'Admin':
        return '/admin/dashboard';
      case 'PropertyOwner':
        return '/owner/dashboard';
      case 'Renter':
        return '/tenant/dashboard';
      default:
        return '/';
    }
  }
}

const authServiceInstance = new AuthService();
export default authServiceInstance;