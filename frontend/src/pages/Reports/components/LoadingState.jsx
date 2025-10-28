import React from 'react';
import './LoadingState.css';

/**
 * LoadingState - Displays loading spinner and message
 *
 * @param {string} message - Optional loading message
 */
const LoadingState = ({ message = 'Loading report data...' }) => {
  return (
    <div className="report-loading">
      <div className="loading-spinner"></div>
      <p>{message}</p>
    </div>
  );
};

export default LoadingState;
