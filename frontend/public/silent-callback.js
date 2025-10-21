// This file handles the silent renew callback in an iframe
// It needs to be a plain JS file (not React) for the iframe to work properly

(function () {
  'use strict';

  // Import UserManager from oidc-client-ts via CDN or bundled version
  // For production, you'd want to include the library properly
  // This is a simplified version that uses the window.parent to communicate

  const url = window.location.href;

  // Use the parent window's UserManager to handle the callback
  if (window.parent && window.parent !== window) {
    // Signal to parent that callback is being processed
    window.parent.postMessage({ type: 'silent-callback', url: url }, window.location.origin);
  }

  // Alternative: Use oidc-client-ts directly if bundled
  // Uncomment if you want to handle it here instead
  /*
  import { UserManager } from 'oidc-client-ts';

  const config = {
    authority: process.env.REACT_APP_ZITADEL_AUTHORITY,
    client_id: process.env.REACT_APP_ZITADEL_CLIENT_ID,
  };

  const userManager = new UserManager(config);
  userManager.signinSilentCallback().catch(err => {
    console.error('Silent callback error:', err);
  });
  */
})();
