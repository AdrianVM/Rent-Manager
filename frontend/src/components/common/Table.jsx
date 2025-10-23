import React from 'react';
import './Table.css';

/**
 * Reusable Table Component
 *
 * @param {Array} columns - Column definitions with { header, accessor, render }
 * @param {Array} data - Array of data objects
 * @param {Function} renderMobileCard - Optional function to render mobile card view
 * @param {string} emptyMessage - Message to show when no data
 * @param {string} className - Additional CSS classes
 */
function Table({
  columns,
  data,
  renderMobileCard,
  emptyMessage = 'No data available',
  className = ''
}) {
  if (!data || data.length === 0) {
    return (
      <div className="table-empty">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className={`table-responsive ${className}`}>
        <table className="table">
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th key={index} className={column.headerClassName}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={row.id || rowIndex}>
                {columns.map((column, colIndex) => (
                  <td key={colIndex} className={column.cellClassName}>
                    {column.render
                      ? column.render(row, rowIndex)
                      : row[column.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      {renderMobileCard && (
        <div className="card-list">
          {data.map((row, index) => (
            <div key={row.id || index} className="card-item">
              {renderMobileCard(row, index)}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default Table;
