import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import AppWrapper from './AppWrapper';
import { ThemeProvider } from './contexts/ThemeContext';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));

// Store registration globally for AppWrapper to access
window.swRegistration = null;
window.showUpdateNotification = null;

root.render(
  <React.StrictMode>
    <ThemeProvider>
      <AppWrapper />
    </ThemeProvider>
  </React.StrictMode>
);

// Register service worker for PWA functionality
serviceWorkerRegistration.register({
  onSuccess: () => console.log('App is ready to work offline'),
  onUpdate: (registration) => {
    console.log('New version available! Showing update notification...');
    window.swRegistration = registration;
    if (window.showUpdateNotification) {
      window.showUpdateNotification(registration);
    }
  },
});