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
  formatDateRange,
  getDatePresetRange,
} from '../../utils/formatters';
import './CashFlow.css';

function CashFlow() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [datePreset, setDatePreset] = useState('year');
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
          const tenant = tenantsData.find((t) => t.id === payment.tenantId);
          if (tenant && tenant.propertyId !== parseInt(selectedProperties)) {
            return false;
          }
        }

        return true;
      });

      // Calculate cash inflows (completed payments)
      const completedPayments = filteredPayments.filter(
        (p) => p.status.toLowerCase() === 'completed'
      );

      const totalCashIn = completedPayments.reduce((sum, p) => sum + p.amount, 0);

      // Calculate cash outflows (future - maintenance costs, etc.)
      const totalCashOut = 0; // Future enhancement

      // Net cash flow
      const netCashFlow = totalCashIn - totalCashOut;

      // Group payments by month for trend analysis
      const monthlyData = groupPaymentsByMonth(
        completedPayments,
        new Date(dateRange.startDate),
        new Date(dateRange.endDate)
      );

      // Get payment method breakdown
      const paymentMethodBreakdown = getPaymentMethodBreakdown(completedPayments);

      setReportData({
        dateRange,
        totalCashIn,
        totalCashOut,
        netCashFlow,
        paymentCount: completedPayments.length,
        monthlyData,
        paymentMethodBreakdown,
      });
    } catch (err) {
      console.error('Error loading cash flow report:', err);
      setError('Failed to load cash flow data');
    } finally {
      setLoading(false);
    }
  };

  const groupPaymentsByMonth = (payments, startDate, endDate) => {
    const months = [];
    const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    while (current <= end) {
      const monthKey = `${current.getFullYear()}-${String(
        current.getMonth() + 1
      ).padStart(2, '0')}`;
      const monthName = current.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      });

      const monthPayments = payments.filter((p) => {
        const paymentDate = new Date(p.date);
        return (
          paymentDate.getFullYear() === current.getFullYear() &&
          paymentDate.getMonth() === current.getMonth()
        );
      });

      const cashIn = monthPayments.reduce((sum, p) => sum + p.amount, 0);
      const cashOut = 0; // Future: expenses

      months.push({
        month: monthName,
        monthKey,
        cashIn,
        cashOut,
        netCashFlow: cashIn - cashOut,
        paymentCount: monthPayments.length,
      });

      current.setMonth(current.getMonth() + 1);
    }

    return months;
  };

  const getPaymentMethodBreakdown = (payments) => {
    const breakdown = {};

    payments.forEach((payment) => {
      const method = payment.method || 'Unknown';
      if (!breakdown[method]) {
        breakdown[method] = {
          method: formatPaymentMethod(method),
          amount: 0,
          count: 0,
        };
      }
      breakdown[method].amount += payment.amount;
      breakdown[method].count += 1;
    });

    return Object.values(breakdown);
  };

  const formatPaymentMethod = (method) => {
    return method
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^\w/, (c) => c.toUpperCase())
      .trim();
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
      <div className="cash-flow-page">
        <ReportHeader
          title="Cash Flow Statement"
          subtitle="Analyze cash inflows and outflows"
        />
        <LoadingState />
      </div>
    );
  }

  if (error) {
    return (
      <div className="cash-flow-page">
        <ReportHeader
          title="Cash Flow Statement"
          subtitle="Analyze cash inflows and outflows"
        />
        <EmptyState icon="⚠️" title="Error Loading Report" message={error} />
      </div>
    );
  }

  const monthlyColumns = [
    { key: 'month', label: 'Month', align: 'left', type: 'text' },
    {
      key: 'cashIn',
      label: 'Cash In',
      align: 'right',
      type: 'currency',
      colorCode: true,
    },
    {
      key: 'cashOut',
      label: 'Cash Out',
      align: 'right',
      type: 'currency',
      colorCode: true,
    },
    {
      key: 'netCashFlow',
      label: 'Net Cash Flow',
      align: 'right',
      type: 'currency',
      colorCode: true,
    },
    { key: 'paymentCount', label: 'Transactions', align: 'right', type: 'text' },
  ];

  const monthlyTotalRow = {
    month: 'Total',
    cashIn: reportData.totalCashIn,
    cashOut: reportData.totalCashOut,
    netCashFlow: reportData.netCashFlow,
    paymentCount: reportData.paymentCount,
  };

  const methodColumns = [
    { key: 'method', label: 'Payment Method', align: 'left', type: 'text' },
    {
      key: 'amount',
      label: 'Total Amount',
      align: 'right',
      type: 'currency',
      colorCode: false,
    },
    { key: 'count', label: 'Transactions', align: 'right', type: 'text' },
  ];

  return (
    <div className="cash-flow-page">
      <ReportHeader
        title="Cash Flow Statement"
        subtitle="Analyze cash inflows and outflows"
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
          icon="💵"
          value={formatCurrency(reportData.totalCashIn)}
          label="Total Cash In"
          valueColor="positive"
        />
        <MetricCard
          icon="💸"
          value={formatCurrency(reportData.totalCashOut)}
          label="Total Cash Out"
          valueColor="negative"
        />
        <MetricCard
          icon="📊"
          value={formatCurrency(reportData.netCashFlow)}
          label="Net Cash Flow"
          valueColor={reportData.netCashFlow >= 0 ? 'positive' : 'negative'}
        />
        <MetricCard
          icon="🔄"
          value={reportData.paymentCount}
          label="Transactions"
        />
      </div>

      {/* Monthly Cash Flow Breakdown */}
      {reportData.monthlyData.length > 0 ? (
        <>
          <h2 className="section-title">Monthly Cash Flow</h2>
          <DataTable
            columns={monthlyColumns}
            data={reportData.monthlyData}
            showTotal={true}
            totalRow={monthlyTotalRow}
          />
        </>
      ) : (
        <EmptyState
          icon="📊"
          title="No Cash Flow Data"
          message="No cash transactions found for the selected period."
        />
      )}

      {/* Payment Method Breakdown */}
      {reportData.paymentMethodBreakdown.length > 0 && (
        <>
          <h2 className="section-title">Cash In by Payment Method</h2>
          <DataTable
            columns={methodColumns}
            data={reportData.paymentMethodBreakdown}
            emptyMessage="No payment methods recorded"
          />
        </>
      )}

      {/* Future Enhancement Note */}
      <div className="enhancement-note">
        <div className="note-icon">💡</div>
        <div className="note-content">
          <strong>Coming Soon:</strong> Expense tracking will be added to show cash
          outflows including maintenance costs, property expenses, and other
          payments. This will provide a complete view of your cash position.
        </div>
      </div>
    </div>
  );
}

export default CashFlow;
