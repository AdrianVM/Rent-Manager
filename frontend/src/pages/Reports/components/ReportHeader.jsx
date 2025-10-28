import React from 'react';
import './ReportHeader.css';

/**
 * ReportHeader - Displays report title, subtitle, and optional actions
 *
 * @param {string} title - Main report title
 * @param {string} subtitle - Report description/subtitle
 * @param {ReactNode} actions - Optional action buttons (e.g., export buttons)
 * @param {string} dateRange - Optional formatted date range to display
 */
const ReportHeader = ({ title, subtitle, actions, dateRange }) => {
  return (
    <div className="report-header">
      <div className="report-header-content">
        <h1 className="report-title">{title}</h1>
        {subtitle && <p className="report-subtitle">{subtitle}</p>}
        {dateRange && <p className="report-date-range">{dateRange}</p>}
      </div>
      {actions && <div className="report-header-actions">{actions}</div>}
    </div>
  );
};

export default ReportHeader;
