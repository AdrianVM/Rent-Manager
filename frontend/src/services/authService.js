const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5057/api';

class AuthService {
  constructor() {
    this.token = localStorage.getItem('authToken');
    this.user = null;

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
      
      localStorage.setItem('authToken', this.token);
      localStorage.setItem('currentUser', JSON.stringify(this.user));
      
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

  async logout() {
    // Call backend logout endpoint if we have a token
    if (this.token) {
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
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('rentManager_userRole'); // Remove old role storage
  }

  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  getCurrentUser() {
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
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }
}

export default new AuthService();