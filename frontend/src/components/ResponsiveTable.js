import React from 'react';

function ResponsiveTable({ data, columns, onEdit, onDelete }) {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th key={index}>{column.header}</th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map(item => (
              <tr key={item.id}>
                {columns.map((column, index) => (
                  <td key={index}>
                    {column.render ? column.render(item) : item[column.key]}
                  </td>
                ))}
                <td>
                  <button
                    className="btn btn-primary"
                    onClick={() => onEdit(item)}
                    style={{ marginRight: '10px' }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => onDelete(item.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Mobile Card View */}
      <div className="card-list">
        {data.map(item => (
          <div key={item.id} className="card-item">
            <div className="card-item-header">
              {columns[0].render ? columns[0].render(item) : item[columns[0].key]}
            </div>
            <div className="card-item-details">
              {columns.slice(1).map((column, index) => (
                <div key={index} className="card-item-detail">
                  <span className="card-item-label">{column.header}:</span>
                  <span className="card-item-value">
                    {column.render ? column.render(item) : item[column.key]}
                  </span>
                </div>
              ))}
            </div>
            <div className="card-item-actions">
              <button
                className="btn btn-primary"
                onClick={() => onEdit(item)}
              >
                Edit
              </button>
              <button
                className="btn btn-danger"
                onClick={() => onDelete(item.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default ResponsiveTable;