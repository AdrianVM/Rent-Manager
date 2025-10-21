import zitadelAuthService from './zitadelAuth';

class AuthService {
  constructor() {
    this.user = null;
  }

  // Initialize - check for Zitadel auth
  async init() {
    try {
      await zitadelAuthService.init();

      if (zitadelAuthService.isAuthenticated()) {
        const profile = zitadelAuthService.getProfile();
        this.user = profile;
        return profile;
      }

      return null;
    } catch (error) {
      console.error('Auth init error:', error);
      return null;
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
    try {
      await zitadelAuthService.signout();
    } catch (error) {
      console.error('Zitadel logout error:', error);
    }

    // Clear memory
    this.user = null;

    // Clean up any old localStorage keys from previous auth implementation
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authMethod');
    localStorage.removeItem('rentManager_userRole');
  }

  isAuthenticated() {
    return zitadelAuthService.isAuthenticated();
  }

  getCurrentUser() {
    if (zitadelAuthService.isAuthenticated()) {
      return zitadelAuthService.getProfile();
    }
    return null;
  }

  getToken() {
    return zitadelAuthService.getAccessToken();
  }

  getAllUserRoles() {
    if (zitadelAuthService.isAuthenticated()) {
      return zitadelAuthService.getAllUserRoles();
    }
    return [];
  }

  hasMultipleRoles() {
    return this.getAllUserRoles().length > 1;
  }

  hasRole(role) {
    const allRoles = this.getAllUserRoles();
    return allRoles.some(r => r.toLowerCase() === role.toLowerCase());
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
    return zitadelAuthService.getAuthHeaders();
  }

  // Get dashboard path based on user role
  getDashboardPath() {
    return zitadelAuthService.getDashboardPath();
  }
}

const authServiceInstance = new AuthService();
export default authServiceInstance;
