import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import ReportHeader from './components/ReportHeader';
import FilterBar from './components/FilterBar';
import MetricCard from './components/MetricCard';
import DataTable from './components/DataTable';
import LoadingState from './components/LoadingState';
import EmptyState from './components/EmptyState';
import {
  formatCurrency,
  formatPercentage,
  formatDateRange,
  getDatePresetRange,
} from '../../utils/formatters';
import './RentCollection.css';

function RentCollection() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [datePreset, setDatePreset] = useState('current-month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedProperties, setSelectedProperties] = useState('all');
  const [properties, setProperties] = useState([]);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datePreset, customStartDate, customEndDate, selectedProperties]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get date range
      const dateRange =
        datePreset === 'custom'
          ? { startDate: customStartDate, endDate: customEndDate }
          : getDatePresetRange(datePreset);

      // Fetch all required data
      const [propertiesData, tenantsData, paymentsData] = await Promise.all([
        apiService.getProperties(),
        apiService.getTenants(),
        apiService.getPayments(),
      ]);

      setProperties(propertiesData);

      // Filter active tenants
      const activeTenants = tenantsData.filter(
        (t) => t.status?.toLowerCase() === 'active'
      );

      // Filter tenants by property if selected
      const filteredTenants =
        selectedProperties === 'all'
          ? activeTenants
          : activeTenants.filter(
              (t) => t.propertyId === parseInt(selectedProperties)
            );

      // Calculate expected rent (all active tenants * rent amount)
      const expectedRent = filteredTenants.reduce(
        (sum, tenant) => sum + (tenant.rentAmount || 0),
        0
      );

      // Filter payments by date range
      const filteredPayments = paymentsData.filter((payment) => {
        const paymentDate = new Date(payment.date);
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        return paymentDate >= startDate && paymentDate <= endDate;
      });

      // Calculate collected rent
      const completedPayments = filteredPayments.filter(
        (p) => p.status.toLowerCase() === 'completed'
      );
      const collectedRent = completedPayments.reduce((sum, p) => sum + p.amount, 0);

      // Calculate pending rent
      const pendingPayments = filteredPayments.filter(
        (p) => p.status.toLowerCase() === 'pending'
      );
      const pendingRent = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

      // Calculate outstanding/overdue (expected - collected - pending)
      const outstandingRent = expectedRent - collectedRent - pendingRent;

      // Collection rate
      const collectionRate =
        expectedRent > 0 ? (collectedRent / expectedRent) * 100 : 0;

      // Build tenant-level breakdown
      const tenantBreakdown = filteredTenants.map((tenant) => {
        const tenantPayments = filteredPayments.filter(
          (p) => p.tenantId === tenant.id
        );
        const completed = tenantPayments.filter(
          (p) => p.status.toLowerCase() === 'completed'
        );
        const pending = tenantPayments.filter(
          (p) => p.status.toLowerCase() === 'pending'
        );

        const property = propertiesData.find((p) => p.id === tenant.propertyId);
        const collected = completed.reduce((sum, p) => sum + p.amount, 0);
        const pendingAmount = pending.reduce((sum, p) => sum + p.amount, 0);
        const expected = tenant.rentAmount || 0;
        const outstanding = expected - collected - pendingAmount;

        return {
          id: tenant.id,
          tenantName: tenant.name,
          property: property?.address || 'Unknown',
          expected,
          collected,
          pending: pendingAmount,
          outstanding: outstanding > 0 ? outstanding : 0,
          status:
            outstanding > 0
              ? 'Overdue'
              : pending.length > 0
              ? 'Pending'
              : 'Paid',
        };
      });

      setReportData({
        dateRange,
        expectedRent,
        collectedRent,
        pendingRent,
        outstandingRent: outstandingRent > 0 ? outstandingRent : 0,
        collectionRate,
        tenantCount: filteredTenants.length,
        completedCount: completedPayments.length,
        pendingCount: pendingPayments.length,
        tenantBreakdown,
      });
    } catch (err) {
      console.error('Error loading rent collection report:', err);
      setError('Failed to load rent collection data');
    } finally {
      setLoading(false);
    }
  };

  const handleDatePresetChange = (preset) => {
    setDatePreset(preset);
    if (preset !== 'custom') {
      const range = getDatePresetRange(preset);
      setCustomStartDate(range.startDate);
      setCustomEndDate(range.endDate);
    }
  };

  const handleCustomDateChange = ({ start, end }) => {
    setCustomStartDate(start);
    setCustomEndDate(end);
  };

  const handleExport = (format) => {
    console.log(`Exporting to ${format}...`);
    alert(`Export to ${format.toUpperCase()} will be implemented soon!`);
  };

  if (loading) {
    return (
      <div className="rent-collection-page">
        <ReportHeader
          title="Rent Collection Report"
          subtitle="Monitor payment performance and collection rates"
        />
        <LoadingState />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rent-collection-page">
        <ReportHeader
          title="Rent Collection Report"
          subtitle="Monitor payment performance and collection rates"
        />
        <EmptyState icon="⚠️" title="Error Loading Report" message={error} />
      </div>
    );
  }

  const columns = [
    { key: 'tenantName', label: 'Tenant', align: 'left', type: 'text' },
    { key: 'property', label: 'Property', align: 'left', type: 'text' },
    {
      key: 'expected',
      label: 'Expected',
      align: 'right',
      type: 'currency',
      colorCode: false,
    },
    {
      key: 'collected',
      label: 'Collected',
      align: 'right',
      type: 'currency',
      colorCode: true,
    },
    {
      key: 'pending',
      label: 'Pending',
      align: 'right',
      type: 'currency',
      colorCode: false,
    },
    {
      key: 'outstanding',
      label: 'Outstanding',
      align: 'right',
      type: 'currency',
      colorCode: true,
    },
    { key: 'status', label: 'Status', align: 'left', type: 'text' },
  ];

  const totalRow = {
    tenantName: 'Total',
    property: '',
    expected: reportData.expectedRent,
    collected: reportData.collectedRent,
    pending: reportData.pendingRent,
    outstanding: reportData.outstandingRent,
    status: '',
  };

  return (
    <div className="rent-collection-page">
      <ReportHeader
        title="Rent Collection Report"
        subtitle="Monitor payment performance and collection rates"
        dateRange={formatDateRange(
          reportData.dateRange.startDate,
          reportData.dateRange.endDate
        )}
      />

      <FilterBar
        datePreset={datePreset}
        onDatePresetChange={handleDatePresetChange}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onCustomDateChange={handleCustomDateChange}
        properties={properties}
        selectedProperties={selectedProperties}
        onPropertyChange={setSelectedProperties}
        onExport={handleExport}
      />

      {/* Summary Metrics */}
      <div className="report-metrics-grid">
        <MetricCard
          icon="💰"
          value={formatCurrency(reportData.expectedRent)}
          label="Expected Rent"
        />
        <MetricCard
          icon="✅"
          value={formatCurrency(reportData.collectedRent)}
          label="Collected Rent"
          valueColor="positive"
        />
        <MetricCard
          icon="⏳"
          value={formatCurrency(reportData.pendingRent)}
          label="Pending Rent"
        />
        <MetricCard
          icon="📊"
          value={formatPercentage(reportData.collectionRate)}
          label="Collection Rate"
          valueColor={reportData.collectionRate >= 90 ? 'positive' : 'negative'}
        />
      </div>

      {/* Collection Progress Bar */}
      <div className="collection-progress">
        <div className="progress-header">
          <h3>Collection Progress</h3>
          <span className="progress-percentage">
            {formatPercentage(reportData.collectionRate, 1)}
          </span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill collected"
            style={{
              width: `${(reportData.collectedRent / reportData.expectedRent) * 100}%`,
            }}
          ></div>
          <div
            className="progress-fill pending"
            style={{
              width: `${(reportData.pendingRent / reportData.expectedRent) * 100}%`,
            }}
          ></div>
        </div>
        <div className="progress-legend">
          <div className="legend-item">
            <span className="legend-color collected"></span>
            <span>Collected: {formatCurrency(reportData.collectedRent)}</span>
          </div>
          <div className="legend-item">
            <span className="legend-color pending"></span>
            <span>Pending: {formatCurrency(reportData.pendingRent)}</span>
          </div>
          <div className="legend-item">
            <span className="legend-color outstanding"></span>
            <span>Outstanding: {formatCurrency(reportData.outstandingRent)}</span>
          </div>
        </div>
      </div>

      {/* Tenant Breakdown */}
      {reportData.tenantBreakdown.length > 0 ? (
        <>
          <h2 className="section-title">Tenant Payment Details</h2>
          <DataTable
            columns={columns}
            data={reportData.tenantBreakdown}
            showTotal={true}
            totalRow={totalRow}
          />
        </>
      ) : (
        <EmptyState
          icon="👥"
          title="No Active Tenants"
          message="No active tenants found for the selected property."
        />
      )}
    </div>
  );
}

export default RentCollection;
