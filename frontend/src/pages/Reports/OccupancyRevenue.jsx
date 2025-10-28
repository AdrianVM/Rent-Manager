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
import './OccupancyRevenue.css';

function OccupancyRevenue() {
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

      // Filter properties if specific property selected
      const filteredProperties =
        selectedProperties === 'all'
          ? propertiesData
          : propertiesData.filter((p) => p.id === parseInt(selectedProperties));

      setProperties(propertiesData);

      // Count total properties
      const totalProperties = filteredProperties.length;

      // Find active tenants for each property
      const activeTenants = tenantsData.filter(
        (t) => t.status?.toLowerCase() === 'active'
      );

      // Count occupied properties (properties with active tenants)
      const occupiedPropertyIds = new Set(
        activeTenants.map((t) => t.propertyId)
      );
      const occupiedCount = filteredProperties.filter((p) =>
        occupiedPropertyIds.has(p.id)
      ).length;

      const vacantCount = totalProperties - occupiedCount;
      const occupancyRate =
        totalProperties > 0 ? (occupiedCount / totalProperties) * 100 : 0;

      // Calculate revenue for the date range
      const filteredPayments = paymentsData.filter((payment) => {
        const paymentDate = new Date(payment.date);
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        return (
          paymentDate >= startDate &&
          paymentDate <= endDate &&
          payment.status.toLowerCase() === 'completed'
        );
      });

      const totalRevenue = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
      const revenuePerProperty =
        totalProperties > 0 ? totalRevenue / totalProperties : 0;

      // Build property-level breakdown
      const propertyBreakdown = filteredProperties.map((property) => {
        const tenant = activeTenants.find((t) => t.propertyId === property.id);
        const isOccupied = !!tenant;

        // Get payments for this property's tenant
        const propertyPayments = tenant
          ? filteredPayments.filter((p) => p.tenantId === tenant.id)
          : [];

        const revenue = propertyPayments.reduce((sum, p) => sum + p.amount, 0);

        // Calculate potential revenue (rent amount for the period)
        const potentialRevenue = tenant ? tenant.rentAmount || 0 : 0;

        return {
          id: property.id,
          address: property.address,
          type: property.type || 'Unknown',
          status: isOccupied ? 'Occupied' : 'Vacant',
          tenant: tenant ? tenant.name : '—',
          rentAmount: tenant ? tenant.rentAmount || 0 : 0,
          revenue,
          potentialRevenue,
        };
      });

      // Calculate total potential revenue (sum of all rent amounts)
      const totalPotentialRevenue = propertyBreakdown.reduce(
        (sum, p) => sum + p.potentialRevenue,
        0
      );

      // Revenue loss from vacancies
      const vacantProperties = propertyBreakdown.filter(
        (p) => p.status === 'Vacant'
      );
      const revenueLoss = vacantProperties.reduce(
        (sum, p) => sum + p.potentialRevenue,
        0
      );

      setReportData({
        dateRange,
        totalProperties,
        occupiedCount,
        vacantCount,
        occupancyRate,
        totalRevenue,
        totalPotentialRevenue,
        revenueLoss,
        revenuePerProperty,
        propertyBreakdown,
      });
    } catch (err) {
      console.error('Error loading occupancy & revenue report:', err);
      setError('Failed to load occupancy & revenue data');
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
      <div className="occupancy-revenue-page">
        <ReportHeader
          title="Occupancy & Revenue Report"
          subtitle="Track vacancy rates and revenue performance"
        />
        <LoadingState />
      </div>
    );
  }

  if (error) {
    return (
      <div className="occupancy-revenue-page">
        <ReportHeader
          title="Occupancy & Revenue Report"
          subtitle="Track vacancy rates and revenue performance"
        />
        <EmptyState icon="⚠️" title="Error Loading Report" message={error} />
      </div>
    );
  }

  const columns = [
    { key: 'address', label: 'Property', align: 'left', type: 'text' },
    { key: 'type', label: 'Type', align: 'left', type: 'text' },
    { key: 'status', label: 'Status', align: 'left', type: 'text' },
    { key: 'tenant', label: 'Tenant', align: 'left', type: 'text' },
    {
      key: 'rentAmount',
      label: 'Monthly Rent',
      align: 'right',
      type: 'currency',
      colorCode: false,
    },
    {
      key: 'revenue',
      label: 'Revenue (Period)',
      align: 'right',
      type: 'currency',
      colorCode: true,
    },
  ];

  return (
    <div className="occupancy-revenue-page">
      <ReportHeader
        title="Occupancy & Revenue Report"
        subtitle="Track vacancy rates and revenue performance"
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
          icon="🏠"
          value={reportData.totalProperties}
          label="Total Properties"
        />
        <MetricCard
          icon="✅"
          value={reportData.occupiedCount}
          label="Occupied"
          valueColor="positive"
        />
        <MetricCard
          icon="📊"
          value={formatPercentage(reportData.occupancyRate)}
          label="Occupancy Rate"
          valueColor={reportData.occupancyRate >= 90 ? 'positive' : 'negative'}
        />
        <MetricCard
          icon="💰"
          value={formatCurrency(reportData.totalRevenue)}
          label="Total Revenue"
          valueColor="positive"
        />
      </div>

      {/* Occupancy Progress Bar */}
      <div className="occupancy-progress">
        <div className="progress-header">
          <h3>Portfolio Occupancy</h3>
          <span className="progress-percentage">
            {formatPercentage(reportData.occupancyRate, 1)}
          </span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill occupied"
            style={{
              width: `${reportData.occupancyRate}%`,
            }}
          ></div>
        </div>
        <div className="progress-legend">
          <div className="legend-item">
            <span className="legend-color occupied"></span>
            <span>
              Occupied: {reportData.occupiedCount} properties (
              {formatPercentage(reportData.occupancyRate, 0)})
            </span>
          </div>
          <div className="legend-item">
            <span className="legend-color vacant"></span>
            <span>
              Vacant: {reportData.vacantCount} properties (
              {formatPercentage(100 - reportData.occupancyRate, 0)})
            </span>
          </div>
        </div>
      </div>

      {/* Revenue Summary */}
      <div className="revenue-summary">
        <div className="summary-item">
          <div className="summary-label">Actual Revenue</div>
          <div className="summary-value positive">
            {formatCurrency(reportData.totalRevenue)}
          </div>
        </div>
        <div className="summary-item">
          <div className="summary-label">Potential Revenue</div>
          <div className="summary-value">
            {formatCurrency(reportData.totalPotentialRevenue)}
          </div>
        </div>
        <div className="summary-item">
          <div className="summary-label">Revenue Loss (Vacancy)</div>
          <div className="summary-value negative">
            {formatCurrency(reportData.revenueLoss)}
          </div>
        </div>
        <div className="summary-item">
          <div className="summary-label">Avg Revenue per Property</div>
          <div className="summary-value">
            {formatCurrency(reportData.revenuePerProperty)}
          </div>
        </div>
      </div>

      {/* Property Breakdown */}
      {reportData.propertyBreakdown.length > 0 ? (
        <>
          <h2 className="section-title">Property Details</h2>
          <DataTable
            columns={columns}
            data={reportData.propertyBreakdown}
            emptyMessage="No properties found"
          />
        </>
      ) : (
        <EmptyState
          icon="🏠"
          title="No Properties"
          message="No properties found in your portfolio."
        />
      )}
    </div>
  );
}

export default OccupancyRevenue;
