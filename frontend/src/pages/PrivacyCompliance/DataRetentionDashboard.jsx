import React, { useState, useEffect } from 'react';
import dataRetentionService from '../../services/dataRetentionService';
import RetentionSchedulesList from './RetentionSchedulesList';
import LegalHoldsManager from './LegalHoldsManager';
import AlertModal from '../../components/common/AlertModal';
import './DataRetentionDashboard.css';

/**
 * Data Retention & Privacy Compliance Dashboard (Admin Only)
 * Manages retention schedules, legal holds, and compliance monitoring
 */
function DataRetentionDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [complianceSummary, setComplianceSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dryRunModal, setDryRunModal] = useState({ isOpen: false, result: null });

  useEffect(() => {
    loadComplianceSummary();
  }, []);

  const loadComplianceSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const summary = await dataRetentionService.getComplianceSummary();
      setComplianceSummary(summary);
    } catch (err) {
      console.error('Error loading compliance summary:', err);
      setError('Failed to load compliance summary');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteDryRun = async () => {
    try {
      setLoading(true);
      const result = await dataRetentionService.executeDryRun();
      setDryRunModal({ isOpen: true, result });
      loadComplianceSummary();
    } catch (err) {
      console.error('Error executing dry run:', err);
      setDryRunModal({
        isOpen: true,
        result: {
          success: false,
          error: err.message
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const getDryRunMessage = () => {
    if (!dryRunModal.result) return '';

    if (!dryRunModal.result.success) {
      return `Failed to execute dry run: ${dryRunModal.result.error}`;
    }

    const r = dryRunModal.result;
    return `Dry Run Complete!\n\n` +
      `Total Records: ${r.totalRecordsProcessed}\n` +
      `Would Delete: ${r.totalRecordsDeleted}\n` +
      `Would Anonymize: ${r.totalRecordsAnonymized}\n` +
      `Would Archive: ${r.totalRecordsArchived}\n\n` +
      `Duration: ${r.duration ? Math.round(r.duration.totalSeconds || 0) : 0}s\n\n` +
      `This was a simulation - no data was actually modified.`;
  };

  if (loading && !complianceSummary) {
    return <div className="data-retention-dashboard loading">Loading compliance data...</div>;
  }

  return (
    <div className="data-retention-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Privacy & Data Retention</h1>
          <p className="subtitle">Manage data retention policies and legal compliance (GDPR Phase 3)</p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={handleExecuteDryRun}
            disabled={loading}
          >
            🧪 Test Deletion (Dry Run)
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`tab ${activeTab === 'schedules' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedules')}
        >
          📋 Retention Schedules
        </button>
        <button
          className={`tab ${activeTab === 'legal-holds' ? 'active' : ''}`}
          onClick={() => setActiveTab('legal-holds')}
        >
          ⚖️ Legal Holds
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            {complianceSummary && (
              <div className="compliance-cards">
                <div className="compliance-card">
                  <div className="card-icon">📋</div>
                  <div className="card-content">
                    <h3>{complianceSummary.totalActiveSchedules}</h3>
                    <p>Active Retention Schedules</p>
                  </div>
                </div>

                <div className="compliance-card">
                  <div className="card-icon">⚖️</div>
                  <div className="card-content">
                    <h3>{complianceSummary.activeLegalHolds}</h3>
                    <p>Active Legal Holds</p>
                  </div>
                </div>

                <div className={`compliance-card ${complianceSummary.schedulesDueForReview > 0 ? 'warning' : 'success'}`}>
                  <div className="card-icon">{complianceSummary.schedulesDueForReview > 0 ? '⚠️' : '✅'}</div>
                  <div className="card-content">
                    <h3>{complianceSummary.schedulesDueForReview}</h3>
                    <p>Schedules Due for Review</p>
                  </div>
                </div>

                <div className="compliance-card">
                  <div className="card-icon">🕐</div>
                  <div className="card-content">
                    <h3>{new Date(complianceSummary.generatedAt).toLocaleDateString()}</h3>
                    <p>Last Updated</p>
                  </div>
                </div>
              </div>
            )}

            <div className="info-section">
              <h2>📚 About Data Retention</h2>
              <div className="info-grid">
                <div className="info-card">
                  <h3>🔄 Automated Deletion</h3>
                  <p>
                    The system automatically deletes, anonymizes, or archives data according to
                    configured retention schedules. This runs daily at 2:00 AM UTC to ensure
                    compliance with GDPR Article 5(1)(e) - storage limitation.
                  </p>
                </div>

                <div className="info-card">
                  <h3>⚖️ Legal Holds</h3>
                  <p>
                    Legal holds prevent data deletion during investigations or litigation.
                    Data under a legal hold is preserved regardless of retention policies
                    until the hold is released by an administrator.
                  </p>
                </div>

                <div className="info-card">
                  <h3>📋 Retention Schedules</h3>
                  <p>
                    Each data category has a defined retention period based on legal requirements
                    (e.g., tax compliance requires 7 years for financial records). Schedules
                    should be reviewed annually and updated when regulations change.
                  </p>
                </div>

                <div className="info-card">
                  <h3>🧪 Testing & Safety</h3>
                  <p>
                    Use the "Test Deletion (Dry Run)" feature to simulate retention policy
                    execution without actually deleting data. This helps verify policies
                    work correctly before running in production.
                  </p>
                </div>
              </div>
            </div>

            {complianceSummary && Object.keys(complianceSummary.schedulesByAction).length > 0 && (
              <div className="action-breakdown">
                <h2>📊 Retention Actions Breakdown</h2>
                <div className="action-cards">
                  {Object.entries(complianceSummary.schedulesByAction).map(([action, count]) => (
                    <div key={action} className="action-card">
                      <div className="action-icon">
                        {action === 'Delete' && '🗑️'}
                        {action === 'Anonymize' && '🔒'}
                        {action === 'Archive' && '📦'}
                      </div>
                      <div className="action-content">
                        <h4>{count}</h4>
                        <p>{action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'schedules' && (
          <RetentionSchedulesList onUpdate={loadComplianceSummary} />
        )}

        {activeTab === 'legal-holds' && (
          <LegalHoldsManager onUpdate={loadComplianceSummary} />
        )}
      </div>

      {/* Dry Run Results Modal */}
      <AlertModal
        isOpen={dryRunModal.isOpen}
        onClose={() => setDryRunModal({ isOpen: false, result: null })}
        type={dryRunModal.result?.success === false ? 'error' : 'success'}
        title={dryRunModal.result?.success === false ? 'Dry Run Failed' : 'Dry Run Complete'}
        message={getDryRunMessage()}
      />
    </div>
  );
}

export default DataRetentionDashboard;
