import { UserManager, WebStorageStateStore } from 'oidc-client-ts';

// Zitadel OAuth 2.0 Configuration
// Authorization Code + PKCE flow (no client secret needed)
const config = {
  authority: process.env.REACT_APP_ZITADEL_AUTHORITY || 'https://your-instance.zitadel.cloud',
  client_id: process.env.REACT_APP_ZITADEL_CLIENT_ID || 'your-client-id@your-project',
  redirect_uri: `${window.location.origin}/auth/callback`,
  post_logout_redirect_uri: `${window.location.origin}/logout`,

  // Authorization Code + PKCE (PKCE is automatic with oidc-client-ts)
  response_type: 'code',

  // Request offline_access for rotating refresh tokens
  scope: 'openid profile email offline_access',

  // Keep tokens in memory (sessionStorage as fallback)
  // Avoid localStorage for better security
  userStore: new WebStorageStateStore({ store: window.sessionStorage }),

  // Automatic silent renew using refresh tokens
  automaticSilentRenew: true,
  silent_redirect_uri: `${window.location.origin}/auth/silent-callback`,

  // Load user info from /userinfo endpoint
  loadUserInfo: true,

  // Monitor session
  monitorSession: false,

  // Filter protocol claims from profile
  filterProtocolClaims: true,
};

class ZitadelAuthService {
  constructor() {
    this.userManager = new UserManager(config);
    this.user = null;

    // Event handlers
    this.userManager.events.addUserLoaded((user) => {
      this.user = user;
    });

    this.userManager.events.addUserUnloaded(() => {
      this.user = null;
    });

    this.userManager.events.addAccessTokenExpiring(() => {
      // Token will auto-renew
    });

    this.userManager.events.addAccessTokenExpired(() => {
      this.signinSilent().catch(() => {
        this.signin();
      });
    });

    this.userManager.events.addSilentRenewError((error) => {
      console.error('Silent renew error:', error);
    });
  }

  // Initialize - load user from storage
  async init() {
    try {
      this.user = await this.userManager.getUser();
      return this.user;
    } catch (error) {
      console.error('Error loading user:', error);
      return null;
    }
  }

  // Start login flow (redirects to Zitadel)
  async signin() {
    try {
      // Don't save login page or root as return URL
      const currentPath = window.location.pathname;
      const shouldSaveReturnUrl = currentPath !== '/login' &&
                                   currentPath !== '/' &&
                                   !currentPath.includes('/auth/');

      await this.userManager.signinRedirect({
        state: {
          returnUrl: shouldSaveReturnUrl ? currentPath : null
        }
      });
    } catch (error) {
      console.error('Sign-in error:', error);
      throw error;
    }
  }

  // Handle callback after redirect from Zitadel
  async handleCallback() {
    try {
      const user = await this.userManager.signinRedirectCallback();
      this.user = user;

      // Get return URL from state
      const returnUrl = user.state?.returnUrl || '/';
      return returnUrl;
    } catch (error) {
      console.error('Callback error:', error);
      throw error;
    }
  }

  // Silent renew (uses refresh token in background)
  async signinSilent() {
    try {
      const user = await this.userManager.signinSilent();
      this.user = user;
      return user;
    } catch (error) {
      console.error('Silent sign-in error:', error);
      throw error;
    }
  }

  // Handle silent callback (iframe)
  async handleSilentCallback() {
    try {
      await this.userManager.signinSilentCallback();
    } catch (error) {
      console.error('Silent callback error:', error);
      throw error;
    }
  }

  // Sign out
  async signout() {
    try {
      await this.userManager.signoutRedirect();
      this.user = null;
    } catch (error) {
      console.error('Sign-out error:', error);
      throw error;
    }
  }

  // Get current user
  getUser() {
    return this.user;
  }

  // Check if authenticated
  isAuthenticated() {
    return this.user && !this.user.expired;
  }

  // Get access token for API calls
  getAccessToken() {
    // Zitadel returns an opaque access_token and a JWT id_token
    // For API authentication, we need to use the id_token which is a proper JWT
    // that the backend can validate
    return this.user?.id_token;
  }

  // Get user profile
  getProfile() {
    if (!this.user) return null;

    return {
      id: this.user.profile.sub,
      email: this.user.profile.email,
      name: this.user.profile.name || this.user.profile.preferred_username || this.user.profile.email,
      // Map Zitadel roles if available
      role: this.getUserRole()
    };
  }

  // Get all user roles from Zitadel claims
  getAllUserRoles() {
    if (!this.user) return [];

    // Check for roles in different claim formats
    let roles = this.user.profile.roles ||
                this.user.profile['urn:zitadel:iam:org:project:roles'] ||
                this.user.profile['urn:zitadel:iam:org:project:343076558480623989:roles'] ||
                [];

    // Ensure roles is an array
    if (!Array.isArray(roles)) {
      // If roles is an object (e.g., {"admin": {...}}), get the keys
      if (typeof roles === 'object' && roles !== null) {
        roles = Object.keys(roles);
      } else if (typeof roles === 'string') {
        // If it's a single string, wrap it in an array
        roles = [roles];
      } else {
        roles = [];
      }
    }

    // Map Zitadel roles to your app roles
    const mappedRoles = [];

    if (roles.some(r => r.toLowerCase() === 'admin')) {
      mappedRoles.push('Admin');
    }
    if (roles.some(r => r.toLowerCase() === 'property-owner' || r.toLowerCase() === 'propertyowner')) {
      mappedRoles.push('PropertyOwner');
    }
    if (roles.some(r => r.toLowerCase() === 'tenant' || r.toLowerCase() === 'renter')) {
      mappedRoles.push('Renter');
    }

    // Default to Renter if no role is specified
    return mappedRoles.length > 0 ? mappedRoles : ['Renter'];
  }

  // Determine user role (you can customize this based on your Zitadel claims)
  // Returns the primary role or first available role
  getUserRole() {
    const allRoles = this.getAllUserRoles();

    // Priority: Admin > PropertyOwner > Renter
    if (allRoles.includes('Admin')) {
      return 'Admin';
    } else if (allRoles.includes('PropertyOwner')) {
      return 'PropertyOwner';
    } else if (allRoles.includes('Renter')) {
      return 'Renter';
    } else {
      return allRoles[0] || 'Renter';
    }
  }

  // Get dashboard path based on user role
  getDashboardPath() {
    const role = this.getUserRole();

    switch (role) {
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

  // Get authorization headers for API calls
  getAuthHeaders() {
    const token = this.getAccessToken();
    if (!token) {
      return {
        'Content-Type': 'application/json'
      };
    }

    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
}

const zitadelAuthService = new ZitadelAuthService();
export default zitadelAuthService;
