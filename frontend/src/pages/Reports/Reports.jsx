import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Reports.css';

function Reports() {
  const navigate = useNavigate();

  const reports = [
    {
      id: 'income-statement',
      icon: '💰',
      title: 'Income Statement',
      subtitle: 'View revenue, expenses, and net profitability',
      description: 'Track total income, expenses, and net operating income across your properties.',
      color: 'var(--color-success)',
      route: '/reports/income-statement',
    },
    {
      id: 'rent-collection',
      icon: '📊',
      title: 'Rent Collection',
      subtitle: 'Monitor payment performance and collection rates',
      description: 'Track expected vs. collected rent, outstanding balances, and late payments.',
      color: 'var(--color-info)',
      route: '/reports/rent-collection',
    },
    {
      id: 'cash-flow',
      icon: '📈',
      title: 'Cash Flow Statement',
      subtitle: 'Analyze cash inflows and outflows',
      description: 'Monitor liquidity with detailed cash flow tracking and monthly trends.',
      color: 'var(--avm-teal)',
      route: '/reports/cash-flow',
    },
    {
      id: 'occupancy-revenue',
      icon: '🏠',
      title: 'Occupancy & Revenue',
      subtitle: 'Track vacancy rates and revenue performance',
      description: 'Measure property utilization, identify vacancies, and optimize revenue.',
      color: 'var(--color-warning)',
      route: '/reports/occupancy-revenue',
    },
  ];

  const handleReportClick = (route) => {
    navigate(route);
  };

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div>
          <h1 className="reports-title">Financial Reports</h1>
          <p className="reports-subtitle">
            Comprehensive financial insights for your rental properties
          </p>
        </div>
      </div>

      <div className="reports-grid">
        {reports.map((report) => (
          <div
            key={report.id}
            className="report-selector-card"
            onClick={() => handleReportClick(report.route)}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleReportClick(report.route);
              }
            }}
          >
            <div className="report-card-icon" style={{ color: report.color }}>
              {report.icon}
            </div>
            <div className="report-card-content">
              <h2 className="report-card-title">{report.title}</h2>
              <p className="report-card-subtitle">{report.subtitle}</p>
              <p className="report-card-description">{report.description}</p>
            </div>
            <div className="report-card-arrow">→</div>
          </div>
        ))}
      </div>

      <div className="reports-info">
        <div className="info-card">
          <div className="info-icon">📅</div>
          <div className="info-content">
            <h3>Custom Date Ranges</h3>
            <p>All reports support flexible date filtering including monthly, quarterly, yearly, and custom ranges.</p>
          </div>
        </div>
        <div className="info-card">
          <div className="info-icon">📄</div>
          <div className="info-content">
            <h3>Export Options</h3>
            <p>Export any report to PDF, CSV, or Excel format for easy sharing and analysis.</p>
          </div>
        </div>
        <div className="info-card">
          <div className="info-icon">🔍</div>
          <div className="info-content">
            <h3>Property Filtering</h3>
            <p>View reports for all properties combined or filter by individual property.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;
