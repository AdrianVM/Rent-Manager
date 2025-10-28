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
  calculatePercentageChange,
} from '../../utils/formatters';
import './IncomeStatement.css';

function IncomeStatement() {
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

      // Fetch properties
      const propertiesData = await apiService.getProperties();
      setProperties(propertiesData);

      // Fetch payments
      const paymentsData = await apiService.getPayments();

      // Filter payments by date range and property
      const filteredPayments = paymentsData.filter((payment) => {
        const paymentDate = new Date(payment.date);
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);

        // Date filter
        if (paymentDate < startDate || paymentDate > endDate) {
          return false;
        }

        // Property filter
        if (selectedProperties !== 'all') {
          // Find tenant for this payment
          const tenant = reportData?.tenants?.find((t) => t.id === payment.tenantId);
          if (tenant && tenant.propertyId !== parseInt(selectedProperties)) {
            return false;
          }
        }

        return true;
      });

      // Fetch tenants to get property associations
      const tenantsData = await apiService.getTenants();

      // Calculate income statement data
      const completedPayments = filteredPayments.filter(
        (p) => p.status.toLowerCase() === 'completed'
      );

      const totalIncome = completedPayments.reduce((sum, p) => sum + p.amount, 0);
      const lateFees = completedPayments
        .filter((p) => p.lateFee)
        .reduce((sum, p) => sum + (p.lateFee || 0), 0);

      // Group revenue by property
      const revenueByProperty = {};

      completedPayments.forEach((payment) => {
        const tenant = tenantsData.find((t) => t.id === payment.tenantId);
        if (tenant) {
          const property = propertiesData.find((p) => p.id === tenant.propertyId);
          if (property) {
            const propertyKey = property.address;
            if (!revenueByProperty[propertyKey]) {
              revenueByProperty[propertyKey] = {
                property: propertyKey,
                revenue: 0,
                paymentCount: 0,
              };
            }
            revenueByProperty[propertyKey].revenue += payment.amount;
            revenueByProperty[propertyKey].paymentCount += 1;
          }
        }
      });

      const propertyBreakdown = Object.values(revenueByProperty);

      // Calculate previous period for comparison
      const previousRange = getPreviousPeriodRange(datePreset, dateRange);
      const previousPayments = paymentsData.filter((payment) => {
        const paymentDate = new Date(payment.date);
        const startDate = new Date(previousRange.startDate);
        const endDate = new Date(previousRange.endDate);
        return (
          paymentDate >= startDate &&
          paymentDate <= endDate &&
          payment.status.toLowerCase() === 'completed'
        );
      });

      const previousIncome = previousPayments.reduce((sum, p) => sum + p.amount, 0);
      const incomeTrend = calculatePercentageChange(totalIncome, previousIncome);

      setReportData({
        dateRange,
        totalIncome,
        lateFees,
        totalExpenses: 0, // Future enhancement
        netIncome: totalIncome, // totalIncome - totalExpenses
        propertyBreakdown,
        paymentCount: completedPayments.length,
        incomeTrend,
        tenants: tenantsData,
      });
    } catch (err) {
      console.error('Error loading income statement:', err);
      setError('Failed to load income statement data');
    } finally {
      setLoading(false);
    }
  };

  const getPreviousPeriodRange = (preset, currentRange) => {
    const start = new Date(currentRange.startDate);
    const end = new Date(currentRange.endDate);
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    const prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - daysDiff);

    const prevEnd = new Date(end);
    prevEnd.setDate(prevEnd.getDate() - daysDiff);

    return {
      startDate: prevStart.toISOString().split('T')[0],
      endDate: prevEnd.toISOString().split('T')[0],
    };
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
    // TODO: Implement export functionality
    console.log(`Exporting to ${format}...`);
    alert(`Export to ${format.toUpperCase()} will be implemented soon!`);
  };

  if (loading) {
    return (
      <div className="income-statement-page">
        <ReportHeader
          title="Income Statement"
          subtitle="View revenue, expenses, and net profitability"
        />
        <LoadingState />
      </div>
    );
  }

  if (error) {
    return (
      <div className="income-statement-page">
        <ReportHeader
          title="Income Statement"
          subtitle="View revenue, expenses, and net profitability"
        />
        <EmptyState
          icon="⚠️"
          title="Error Loading Report"
          message={error}
        />
      </div>
    );
  }

  const columns = [
    { key: 'property', label: 'Property', align: 'left', type: 'text' },
    { key: 'revenue', label: 'Revenue', align: 'right', type: 'currency', colorCode: true },
    { key: 'paymentCount', label: 'Payments', align: 'right', type: 'text' },
  ];

  const totalRow = {
    property: 'Total',
    revenue: reportData.totalIncome,
    paymentCount: reportData.paymentCount,
  };

  return (
    <div className="income-statement-page">
      <ReportHeader
        title="Income Statement"
        subtitle="View revenue, expenses, and net profitability"
        dateRange={formatDateRange(reportData.dateRange.startDate, reportData.dateRange.endDate)}
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
          value={formatCurrency(reportData.totalIncome)}
          label="Total Revenue"
          trend={reportData.incomeTrend}
          trendLabel="vs previous period"
          valueColor="positive"
        />
        <MetricCard
          icon="📊"
          value={formatCurrency(reportData.totalExpenses)}
          label="Total Expenses"
          valueColor="negative"
        />
        <MetricCard
          icon="📈"
          value={formatCurrency(reportData.netIncome)}
          label="Net Income"
          valueColor={reportData.netIncome > 0 ? 'positive' : 'negative'}
        />
        <MetricCard
          icon="💳"
          value={reportData.paymentCount}
          label="Payments Received"
        />
      </div>

      {/* Revenue Breakdown by Property */}
      {reportData.propertyBreakdown.length > 0 ? (
        <>
          <h2 className="section-title">Revenue by Property</h2>
          <DataTable
            columns={columns}
            data={reportData.propertyBreakdown}
            showTotal={true}
            totalRow={totalRow}
          />
        </>
      ) : (
        <EmptyState
          icon="📊"
          title="No Revenue Data"
          message="No completed payments found for the selected period."
        />
      )}

      {/* Future Enhancement Note */}
      <div className="enhancement-note">
        <div className="note-icon">💡</div>
        <div className="note-content">
          <strong>Coming Soon:</strong> Expense tracking functionality will be added to provide complete Profit & Loss statements with detailed expense categories and net profitability analysis.
        </div>
      </div>
    </div>
  );
}

export default IncomeStatement;
