import React from 'react';
import './EmptyState.css';

/**
 * EmptyState - Displays when no data is available
 *
 * @param {string} icon - Emoji icon to display
 * @param {string} title - Empty state title
 * @param {string} message - Empty state message
 */
const EmptyState = ({
  icon = '📊',
  title = 'No Data Available',
  message = 'There is no data to display for the selected period.',
}) => {
  return (
    <div className="report-empty">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
};

export default EmptyState;
