import React from 'react';
import './DataTable.css';
import { formatCurrency, formatPercentage } from '../../../utils/formatters';

/**
 * DataTable - Displays financial data in a formatted table
 *
 * @param {array} columns - Array of column definitions
 *   - key: string - Data key
 *   - label: string - Column header label
 *   - align: 'left' | 'right' - Text alignment
 *   - type: 'text' | 'currency' | 'percentage' - Data type for formatting
 *   - colorCode: boolean - Whether to apply positive/negative coloring
 * @param {array} data - Array of data objects
 * @param {boolean} showTotal - Whether to show a total row
 * @param {object} totalRow - Object with totals for each column
 * @param {string} emptyMessage - Message to display when no data
 */
const DataTable = ({
  columns,
  data,
  showTotal = false,
  totalRow = null,
  emptyMessage = 'No data available',
}) => {
  const renderCell = (column, row) => {
    const value = row[column.key];

    if (value === null || value === undefined) {
      return '—';
    }

    // Format based on column type
    switch (column.type) {
      case 'currency':
        return formatCurrency(value);
      case 'percentage':
        return formatPercentage(value);
      default:
        return value;
    }
  };

  const getCellClass = (column, value) => {
    const classes = [];

    if (column.align === 'right') {
      classes.push('align-right');
    }

    if (column.type === 'currency' || column.type === 'percentage') {
      classes.push('currency');

      if (value !== null && value !== undefined && column.colorCode) {
        if (value > 0) {
          classes.push('positive-value');
        } else if (value < 0) {
          classes.push('negative-value');
        }
      }
    }

    return classes.join(' ');
  };

  if (!data || data.length === 0) {
    return (
      <div className="report-table-container">
        <div className="table-empty">
          <div className="empty-icon">📊</div>
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="report-table-container">
      <table className="report-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={column.align === 'right' ? 'align-right' : ''}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={row.id || index}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={getCellClass(column, row[column.key])}
                  data-label={column.label}
                >
                  {renderCell(column, row)}
                </td>
              ))}
            </tr>
          ))}

          {showTotal && totalRow && (
            <tr className="total-row">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={column.align === 'right' ? 'align-right currency' : ''}
                >
                  {totalRow[column.key] !== undefined && totalRow[column.key] !== null
                    ? column.type === 'currency'
                      ? formatCurrency(totalRow[column.key])
                      : column.type === 'percentage'
                      ? formatPercentage(totalRow[column.key])
                      : totalRow[column.key]
                    : ''}
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
