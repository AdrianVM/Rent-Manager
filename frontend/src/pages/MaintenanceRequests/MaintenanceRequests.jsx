import React, { useState, useEffect, useMemo } from 'react';
import apiService from '../../services/api';
import MaintenanceRequestModal from '../../components/MaintenanceRequestModal';
import './MaintenanceRequests.css';

function MaintenanceRequests() {
  const [requests, setRequests] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tenantsData, propertiesData] = await Promise.all([
        apiService.getTenants(),
        apiService.getProperties()
      ]);
      setTenants(tenantsData || []);
      setProperties(propertiesData || []);

      const currentTenant = tenantsData?.find(t => t.status.toLowerCase() === 'active');
      if (currentTenant) {
        await loadRequests(currentTenant.id);
      }
      setError(null);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async (tenantId) => {
    try {
      const data = await apiService.getMaintenanceRequestsByTenant(tenantId);
      setRequests(data || []);
    } catch (err) {
      console.error('Error loading maintenance requests:', err);
      setError('Failed to load maintenance requests.');
    }
  };

  const handleRequestSubmitted = async () => {
    const currentTenant = tenants.find(t => t.status.toLowerCase() === 'active');
    if (currentTenant) {
      await loadRequests(currentTenant.id);
    }
  };

  const currentTenant = useMemo(() => {
    return tenants.find(t => t.status.toLowerCase() === 'active') || null;
  }, [tenants]);

  const currentProperty = useMemo(() => {
    if (!currentTenant) return null;
    return properties.find(p => p.id === currentTenant.propertyId) || null;
  }, [currentTenant, properties]);

  const filteredAndSortedRequests = useMemo(() => {
    let filtered = [...requests];

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(req =>
        req.status.toLowerCase() === filterStatus.toLowerCase()
      );
    }

    // Filter by priority
    if (filterPriority !== 'all') {
      filtered = filtered.filter(req =>
        req.priority.toLowerCase() === filterPriority.toLowerCase()
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'date-asc':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'priority-high':
          const priorityOrder = { Emergency: 4, High: 3, Medium: 2, Low: 1 };
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        case 'priority-low':
          const priorityOrderLow = { Emergency: 4, High: 3, Medium: 2, Low: 1 };
          return (priorityOrderLow[a.priority] || 0) - (priorityOrderLow[b.priority] || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [requests, filterStatus, filterPriority, sortBy]);

  const requestStats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter(r => r.status.toLowerCase() === 'pending').length,
      inProgress: requests.filter(r => r.status.toLowerCase() === 'inprogress').length,
      completed: requests.filter(r => r.status.toLowerCase() === 'completed').length
    };
  }, [requests]);

  const getStatusBadge = (status) => {
    const displayStatus = status.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
    const cssClass = status.toLowerCase().replace(/([A-Z])/g, '_$1');
    return (
      <span className={`mr-status-badge ${cssClass}`}>
        {displayStatus}
      </span>
    );
  };

  const getPriorityIcon = (priority) => {
    const icons = {
      Emergency: '🔴',
      High: '🔴',
      Medium: '🟡',
      Low: '🟢'
    };
    return icons[priority] || '🟡';
  };

  const getPriorityLabel = (priority) => {
    return (
      <span className={`mr-priority-badge ${priority.toLowerCase()}`}>
        {getPriorityIcon(priority)} {priority}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();

    // Compare dates by their components in local timezone
    const isToday = date.getDate() === now.getDate() &&
                    date.getMonth() === now.getMonth() &&
                    date.getFullYear() === now.getFullYear();

    if (isToday) {
      return 'Today';
    }

    // Check if yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const isYesterday = date.getDate() === yesterday.getDate() &&
                        date.getMonth() === yesterday.getMonth() &&
                        date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
      return 'Yesterday';
    }

    // Calculate days difference for "X days ago"
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((startOfToday - startOfDate) / (1000 * 60 * 60 * 24));

    if (diffDays < 7) {
      return `${diffDays} days ago`;
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  if (loading) {
    return (
      <div className="mr-page">
        <div className="mr-loading">
          <div className="mr-loading-spinner"></div>
          <p>Loading maintenance requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mr-page">
        <div className="mr-error">
          <div className="mr-error-icon">⚠️</div>
          <h2>Error Loading Data</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadData}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!currentTenant) {
    return (
      <div className="mr-page">
        <div className="mr-error">
          <div className="mr-error-icon">🏠</div>
          <h2>No Active Lease</h2>
          <p>You don't have an active lease at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mr-page">
      <div className="mr-header">
        <div className="mr-header-content">
          <h1 className="mr-title">Maintenance Requests</h1>
          <p className="mr-subtitle">
            {currentProperty?.name || 'Your Property'}
          </p>
        </div>
        <button
          className="btn btn-primary mr-submit-btn"
          onClick={() => setShowModal(true)}
        >
          <span className="mr-submit-icon">+</span>
          New Request
        </button>
      </div>

      {/* Stats Cards */}
      <div className="mr-stats-grid">
        <div className="mr-stat-card">
          <div className="mr-stat-icon">📋</div>
          <div className="mr-stat-content">
            <div className="mr-stat-value">{requestStats.total}</div>
            <div className="mr-stat-label">Total Requests</div>
          </div>
        </div>
        <div className="mr-stat-card">
          <div className="mr-stat-icon">⏳</div>
          <div className="mr-stat-content">
            <div className="mr-stat-value">{requestStats.pending}</div>
            <div className="mr-stat-label">Pending</div>
          </div>
        </div>
        <div className="mr-stat-card">
          <div className="mr-stat-icon">🔧</div>
          <div className="mr-stat-content">
            <div className="mr-stat-value">{requestStats.inProgress}</div>
            <div className="mr-stat-label">In Progress</div>
          </div>
        </div>
        <div className="mr-stat-card">
          <div className="mr-stat-icon">✅</div>
          <div className="mr-stat-content">
            <div className="mr-stat-value">{requestStats.completed}</div>
            <div className="mr-stat-label">Completed</div>
          </div>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="mr-controls">
        <div className="mr-filters">
          <div className="mr-filter-group">
            <label htmlFor="status-filter">Status:</label>
            <select
              id="status-filter"
              className="mr-filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="inprogress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="mr-filter-group">
            <label htmlFor="priority-filter">Priority:</label>
            <select
              id="priority-filter"
              className="mr-filter-select"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="emergency">Emergency</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
        <div className="mr-sort">
          <label htmlFor="sort-select">Sort by:</label>
          <select
            id="sort-select"
            className="mr-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="priority-high">Priority (High to Low)</option>
            <option value="priority-low">Priority (Low to High)</option>
          </select>
        </div>
      </div>

      {/* Requests List */}
      <div className="mr-list">
        {filteredAndSortedRequests.length === 0 ? (
          <div className="mr-empty">
            <div className="mr-empty-icon">🔧</div>
            <h3>No Requests Found</h3>
            {requests.length === 0 ? (
              <p>You haven't submitted any maintenance requests yet.</p>
            ) : (
              <p>No requests match your current filters.</p>
            )}
            <button
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
            >
              Submit Your First Request
            </button>
          </div>
        ) : (
          filteredAndSortedRequests.map(request => (
            <div key={request.id} className="mr-card">
              <div className="mr-card-header">
                <div className="mr-card-title-row">
                  {getPriorityLabel(request.priority)}
                  <h3 className="mr-card-title">{request.title}</h3>
                </div>
                {getStatusBadge(request.status)}
              </div>
              <p className="mr-card-description">{request.description}</p>
              <div className="mr-card-footer">
                <div className="mr-card-meta">
                  <span className="mr-card-date">
                    📅 Submitted {formatDate(request.createdAt)}
                  </span>
                  {request.assignedTo && (
                    <span className="mr-card-assigned">
                      👤 Assigned to {request.assignedTo}
                    </span>
                  )}
                </div>
                {request.resolvedAt && (
                  <span className="mr-card-resolved">
                    ✓ Resolved {formatDate(request.resolvedAt)}
                  </span>
                )}
              </div>
              {request.resolutionNotes && (
                <div className="mr-card-resolution">
                  <strong>Resolution Notes:</strong>
                  <p>{request.resolutionNotes}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <MaintenanceRequestModal
          onClose={() => setShowModal(false)}
          onSuccess={handleRequestSubmitted}
          tenantId={currentTenant.id}
          propertyId={currentTenant.propertyId}
        />
      )}
    </div>
  );
}

export default MaintenanceRequests;
