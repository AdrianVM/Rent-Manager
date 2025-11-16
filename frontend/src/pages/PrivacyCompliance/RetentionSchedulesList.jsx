import React, { useState, useEffect } from 'react';
import dataRetentionService from '../../services/dataRetentionService';
import './RetentionSchedulesList.css';

function RetentionSchedulesList({ onUpdate }) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // const [editingSchedule, setEditingSchedule] = useState(null); // TODO: Implement editing
  // const [showCreateForm, setShowCreateForm] = useState(false); // TODO: Implement create form

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dataRetentionService.getRetentionSchedules();
      setSchedules(data);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error loading schedules:', err);
      setError('Failed to load retention schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReviewed = async (id) => {
    if (!window.confirm('Mark this schedule as reviewed?')) return;

    try {
      await dataRetentionService.markScheduleAsReviewed(id);
      loadSchedules();
    } catch (err) {
      console.error('Failed to mark schedule as reviewed:', err);
      alert('Failed to mark schedule as reviewed: ' + err.message);
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this retention schedule? This will stop automatic deletion for this data category.')) return;

    try {
      await dataRetentionService.deactivateRetentionSchedule(id);
      loadSchedules();
    } catch (err) {
      console.error('Failed to deactivate schedule:', err);
      alert('Failed to deactivate schedule: ' + err.message);
    }
  };

  const getActionBadgeClass = (action) => {
    const actionLower = action.toLowerCase();
    if (actionLower === 'delete') return 'badge-delete';
    if (actionLower === 'anonymize') return 'badge-anonymize';
    if (actionLower === 'archive') return 'badge-archive';
    return 'badge-default';
  };

  const formatRetentionPeriod = (months) => {
    if (months === 0) return 'While active';
    if (months < 12) return `${months} months`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) return `${years} ${years === 1 ? 'year' : 'years'}`;
    return `${years}y ${remainingMonths}m`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = (schedule) => {
    if (!schedule.lastReviewedAt) {
      // Never reviewed - overdue if older than 1 year
      const createdDate = new Date(schedule.createdAt);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return createdDate < oneYearAgo;
    }
    const lastReviewed = new Date(schedule.lastReviewedAt);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return lastReviewed < oneYearAgo;
  };

  if (loading) {
    return <div className="schedules-list loading">Loading retention schedules...</div>;
  }

  if (error) {
    return (
      <div className="schedules-list error">
        <p>{error}</p>
        <button onClick={loadSchedules} className="btn btn-secondary">Retry</button>
      </div>
    );
  }

  return (
    <div className="schedules-list">
      <div className="list-header">
        <h2>📋 Retention Schedules</h2>
        <p className="subtitle">
          Defines how long different categories of data are retained before automatic deletion
        </p>
      </div>

      {schedules.length === 0 ? (
        <div className="empty-state">
          <p>No retention schedules configured</p>
        </div>
      ) : (
        <div className="schedules-table">
          <table>
            <thead>
              <tr>
                <th>Data Category</th>
                <th>Description</th>
                <th>Retention Period</th>
                <th>Action</th>
                <th>Legal Basis</th>
                <th>Last Reviewed</th>
                <th>Status</th>
                <th className="actions-column">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((schedule) => (
                <tr key={schedule.id} className={!schedule.isActive ? 'inactive' : ''}>
                  <td>
                    <strong>{schedule.dataCategory.replace(/_/g, ' ')}</strong>
                  </td>
                  <td className="description-cell">{schedule.description}</td>
                  <td>{formatRetentionPeriod(schedule.retentionMonths)}</td>
                  <td>
                    <span className={`badge ${getActionBadgeClass(schedule.action)}`}>
                      {schedule.action === 'Delete' && '🗑️ '}
                      {schedule.action === 'Anonymize' && '🔒 '}
                      {schedule.action === 'Archive' && '📦 '}
                      {schedule.action}
                    </span>
                  </td>
                  <td className="legal-basis-cell">{schedule.legalBasis}</td>
                  <td>
                    <span className={isOverdue(schedule) ? 'overdue' : ''}>
                      {formatDate(schedule.lastReviewedAt)}
                      {isOverdue(schedule) && ' ⚠️'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${schedule.isActive ? 'active' : 'inactive'}`}>
                      {schedule.isActive ? '✅ Active' : '❌ Inactive'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      className="btn-icon"
                      onClick={() => handleMarkReviewed(schedule.id)}
                      title="Mark as reviewed"
                      disabled={!schedule.isActive}
                    >
                      ✓
                    </button>
                    <button
                      className="btn-icon btn-danger"
                      onClick={() => handleDeactivate(schedule.id)}
                      title="Deactivate schedule"
                      disabled={!schedule.isActive}
                    >
                      ❌
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="schedules-legend">
        <h3>Retention Actions</h3>
        <div className="legend-items">
          <div className="legend-item">
            <span className="badge badge-delete">🗑️ Delete</span>
            <span>Permanently removes data after retention period</span>
          </div>
          <div className="legend-item">
            <span className="badge badge-anonymize">🔒 Anonymize</span>
            <span>Removes personally identifiable information while keeping statistical data</span>
          </div>
          <div className="legend-item">
            <span className="badge badge-archive">📦 Archive</span>
            <span>Moves data to long-term cold storage</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RetentionSchedulesList;
