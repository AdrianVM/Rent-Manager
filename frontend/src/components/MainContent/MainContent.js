import React from 'react';
import styles from './MainContent.module.css';

function MainContent({ children, className = '' }) {
  return (
    <main className={`${styles.mainContent} ${className}`}>
      {children}
    </main>
  );
}

export default MainContent;
