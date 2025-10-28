import React from 'react';
import './FilterBar.css';
import { getDatePresetLabel } from '../../../utils/formatters';

/**
 * FilterBar - Provides date range selection, property filtering, and export options
 *
 * @param {string} datePreset - Selected date preset (current-month, last-month, quarter, year, custom)
 * @param {function} onDatePresetChange - Callback when date preset changes
 * @param {string} customStartDate - Custom start date (YYYY-MM-DD)
 * @param {string} customEndDate - Custom end date (YYYY-MM-DD)
 * @param {function} onCustomDateChange - Callback when custom dates change
 * @param {array} properties - Array of property objects for filtering
 * @param {string} selectedProperties - Selected property ID or 'all'
 * @param {function} onPropertyChange - Callback when property selection changes
 * @param {function} onExport - Callback for export (receives format: 'pdf', 'csv', 'excel')
 */
const FilterBar = ({
  datePreset,
  onDatePresetChange,
  customStartDate,
  customEndDate,
  onCustomDateChange,
  properties,
  selectedProperties,
  onPropertyChange,
  onExport,
}) => {
  const datePresets = [
    { value: 'current-month', label: 'This Month' },
    { value: 'last-month', label: 'Last Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
    { value: 'last-year', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' },
  ];

  return (
    <div className="report-filter-bar">
      {/* Date Range Filter */}
      <div className="filter-group">
        <label htmlFor="date-preset" className="filter-label">
          Period:
        </label>
        <select
          id="date-preset"
          className="filter-select"
          value={datePreset}
          onChange={(e) => onDatePresetChange(e.target.value)}
        >
          {datePresets.map((preset) => (
            <option key={preset.value} value={preset.value}>
              {preset.label}
            </option>
          ))}
        </select>
      </div>

      {/* Custom Date Range (shown only when custom is selected) */}
      {datePreset === 'custom' && (
        <>
          <div className="filter-group">
            <label htmlFor="start-date" className="filter-label">
              From:
            </label>
            <input
              type="date"
              id="start-date"
              className="filter-input"
              value={customStartDate}
              onChange={(e) =>
                onCustomDateChange({ start: e.target.value, end: customEndDate })
              }
            />
          </div>
          <div className="filter-group">
            <label htmlFor="end-date" className="filter-label">
              To:
            </label>
            <input
              type="date"
              id="end-date"
              className="filter-input"
              value={customEndDate}
              onChange={(e) =>
                onCustomDateChange({ start: customStartDate, end: e.target.value })
              }
            />
          </div>
        </>
      )}

      {/* Property Filter (for multi-property owners) */}
      {properties && properties.length > 1 && (
        <div className="filter-group">
          <label htmlFor="property-filter" className="filter-label">
            Property:
          </label>
          <select
            id="property-filter"
            className="filter-select"
            value={selectedProperties}
            onChange={(e) => onPropertyChange(e.target.value)}
          >
            <option value="all">All Properties</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.address}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Export Buttons */}
      {onExport && (
        <div className="export-buttons">
          <button
            className="export-btn"
            onClick={() => onExport('pdf')}
            title="Export to PDF format"
          >
            <span className="export-btn-icon">📄</span>
            <span>PDF</span>
          </button>
          <button
            className="export-btn"
            onClick={() => onExport('csv')}
            title="Export to CSV format"
          >
            <span className="export-btn-icon">📊</span>
            <span>CSV</span>
          </button>
          <button
            className="export-btn"
            onClick={() => onExport('excel')}
            title="Export to Excel format"
          >
            <span className="export-btn-icon">📈</span>
            <span>Excel</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
