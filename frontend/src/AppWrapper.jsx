import React, { useState, useEffect } from 'react';
import App from './App';
import UpdateNotification from './components/UpdateNotification';

function AppWrapper() {
  const [updateRegistration, setUpdateRegistration] = useState(null);

  useEffect(() => {
    // Set up global function to show update notification
    window.showUpdateNotification = (registration) => {
      setUpdateRegistration(registration);
    };

    return () => {
      window.showUpdateNotification = null;
    };
  }, []);

  const handleDismiss = () => {
    setUpdateRegistration(null);
  };

  return (
    <>
      <App />
      {updateRegistration && (
        <UpdateNotification
          registration={updateRegistration}
          onDismiss={handleDismiss}
        />
      )}
    </>
  );
}

export default AppWrapper;
