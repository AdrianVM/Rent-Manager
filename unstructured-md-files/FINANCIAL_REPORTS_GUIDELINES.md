# Financial Reports - Front-End Developer Guidelines
## Rent-Manager Property Owner Financial Reports

**Version:** 1.0
**Design System:** Apple-Inspired Glassmorphism
**Last Updated:** 2025-10-28

---

## Table of Contents
1. [Component Architecture](#component-architecture)
2. [Layout Specifications](#layout-specifications)
3. [UI Component Guidelines](#ui-component-guidelines)
4. [Styling Guidelines](#styling-guidelines)
5. [Data Visualization](#data-visualization)
6. [Number Formatting](#number-formatting)
7. [Responsive Behavior](#responsive-behavior)
8. [Code Examples](#code-examples)

---

## 1. Component Architecture

### 1.1 Component Hierarchy

```
Reports/
├── Reports.jsx                    // Main report selector/landing page
├── components/
│   ├── ReportHeader.jsx          // Shared: Title, subtitle, action buttons
│   ├── FilterBar.jsx             // Shared: Date pickers, property filters
│   ├── MetricCard.jsx            // Shared: KPI summary cards
│   ├── DataTable.jsx             // Shared: Financial data tables
│   ├── ReportChart.jsx           // Shared: Chart wrapper
│   ├── ExportButtons.jsx         // Shared: PDF/CSV/Excel export
│   ├── EmptyState.jsx            // Shared: No data state
│   └── LoadingState.jsx          // Shared: Loading skeleton
├── IncomeStatement.jsx
├── RentCollection.jsx
├── CashFlow.jsx
├── OccupancyRevenue.jsx
└── Reports.css                    // Shared styles
```

### 1.2 Shared Components (Reusable)

**ReportHeader** - Displays report title, subtitle, and primary actions
```jsx
<ReportHeader
  title="Income Statement"
  subtitle="View revenue, expenses, and net profitability"
  actions={<ExportButtons />}
/>
```

**FilterBar** - Date range, property selector, and filters
```jsx
<FilterBar
  dateRange={dateRange}
  onDateChange={handleDateChange}
  properties={properties}
  selectedProperties={selectedProperties}
  onPropertyChange={handlePropertyChange}
/>
```

**MetricCard** - KPI summary card
```jsx
<MetricCard
  icon="💰"
  value="$45,230"
  label="Total Revenue"
  trend={+12.5}  // Optional percentage change
  trendLabel="vs last month"
/>
```

**DataTable** - Financial data table with proper formatting
```jsx
<DataTable
  columns={columns}
  data={data}
  sortable={true}
  hoverable={true}
/>
```

---

## 2. Layout Specifications

### 2.1 Page Container

```css
.report-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--space-2xl); /* 32px */
  min-height: 100vh;
}
```

### 2.2 Standard Report Layout Structure

```jsx
<div className="report-page">
  {/* 1. Header Section */}
  <ReportHeader />

  {/* 2. Filter Controls */}
  <FilterBar />

  {/* 3. Summary Metrics */}
  <div className="report-metrics-grid">
    <MetricCard />
    <MetricCard />
    <MetricCard />
    <MetricCard />
  </div>

  {/* 4. Main Content Area */}
  <div className="report-content">
    {/* Charts */}
    <div className="report-charts">
      <ReportChart type="line" />
    </div>

    {/* Data Tables */}
    <div className="report-tables">
      <DataTable />
    </div>
  </div>
</div>
```

### 2.3 Grid Layout for Metrics

```css
.report-metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-md); /* 16px */
  margin-bottom: var(--space-2xl); /* 32px */
  animation: fadeIn 0.8s ease-out 0.2s both;
}
```

---

## 3. UI Component Guidelines

### 3.1 Report Header

**Visual Specifications:**
- Title: 42px, font-weight 700, gradient text
- Subtitle: 16px, secondary color
- Spacing: 8px between title and subtitle

**Complete CSS:**
```css
.report-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-xl); /* 24px */
  animation: slideDown 0.6s ease-out;
  flex-wrap: wrap;
  gap: var(--space-md);
}

.report-title {
  font-size: 42px;
  font-weight: 700;
  letter-spacing: -0.03em;
  background: linear-gradient(135deg, var(--avm-royal-blue) 0%, var(--avm-teal) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 8px 0;
}

[data-theme="dark"] .report-title {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--avm-teal) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.report-subtitle {
  font-size: 16px;
  font-weight: 400;
  color: var(--text-secondary);
  margin: 0;
  letter-spacing: -0.01em;
}

.report-header-actions {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
}
```

### 3.2 Filter Bar (Glassmorphic)

**Visual Specifications:**
- Glassmorphic card with backdrop blur
- Horizontal layout with flex-wrap
- Consistent spacing between filter groups

**Complete CSS:**
```css
.report-filter-bar {
  background: var(--card-bg);
  backdrop-filter: var(--card-backdrop-blur);
  -webkit-backdrop-filter: var(--card-backdrop-blur);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-xl); /* 16px */
  box-shadow: var(--card-shadow);
  padding: var(--space-lg) var(--space-xl);
  margin-bottom: var(--space-2xl);
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-xl);
  transition: all var(--transition-base);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.filter-label {
  font-size: var(--font-size-sm); /* 14px */
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  white-space: nowrap;
}

.filter-select,
.filter-input {
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--border-base);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-base);
  min-width: 150px;
}

.filter-select:hover,
.filter-input:hover {
  border-color: var(--color-primary);
}

.filter-select:focus,
.filter-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--bg-overlay);
}
```

### 3.3 Metric Cards (Summary KPIs)

**Visual Specifications:**
- Glassmorphic cards with hover lift effect
- Large value (28px bold), small label (14px secondary)
- Optional trend indicator (percentage change)
- Icon on the left, content on the right

**Complete CSS:**
```css
.metric-card {
  background: var(--card-bg);
  backdrop-filter: var(--card-backdrop-blur);
  -webkit-backdrop-filter: var(--card-backdrop-blur);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--card-shadow);
  padding: var(--space-xl);
  display: flex;
  align-items: center;
  gap: var(--space-md);
  transition: all var(--transition-slower);
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--card-shadow-hover);
}

.metric-icon {
  font-size: var(--font-size-3xl); /* 32px */
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.metric-content {
  flex: 1;
  min-width: 0;
}

.metric-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
  margin-bottom: 4px;
}

.metric-value.positive {
  color: var(--color-success);
}

.metric-value.negative {
  color: var(--color-danger);
}

.metric-label {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.metric-trend {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  margin-top: 4px;
}

.metric-trend.positive {
  color: var(--color-success);
}

.metric-trend.negative {
  color: var(--color-danger);
}

.metric-trend-icon {
  font-size: 14px;
}
```

### 3.4 Data Tables

**Visual Specifications:**
- Full-width glassmorphic container
- Striped rows for readability
- Hover effect on rows
- Right-aligned numbers, left-aligned text
- Bold totals row

**Complete CSS:**
```css
.report-table-container {
  background: var(--card-bg);
  backdrop-filter: var(--card-backdrop-blur);
  -webkit-backdrop-filter: var(--card-backdrop-blur);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--card-shadow);
  padding: var(--space-xl);
  margin-bottom: var(--space-xl);
  overflow-x: auto;
}

.report-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.report-table thead {
  border-bottom: 2px solid var(--border-base);
}

.report-table th {
  padding: var(--space-md);
  text-align: left;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.report-table th.align-right,
.report-table td.align-right {
  text-align: right;
}

.report-table tbody tr {
  border-bottom: 1px solid var(--border-base);
  transition: background-color var(--transition-base);
}

.report-table tbody tr:hover {
  background-color: var(--bg-overlay);
}

.report-table td {
  padding: var(--space-md);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.report-table .currency {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum";
}

.report-table .total-row {
  font-weight: var(--font-weight-bold);
  background-color: var(--bg-secondary);
  border-top: 2px solid var(--border-base);
}

.report-table .positive-value {
  color: var(--color-success);
}

.report-table .negative-value {
  color: var(--color-danger);
}

/* Mobile: Horizontal scroll */
@media (max-width: 768px) {
  .report-table-container {
    overflow-x: scroll;
    -webkit-overflow-scrolling: touch;
  }

  .report-table {
    min-width: 600px;
  }
}
```

### 3.5 Chart Containers

**Visual Specifications:**
- Glassmorphic card
- Minimum height for charts
- Padding for chart spacing

**Complete CSS:**
```css
.chart-container {
  background: var(--card-bg);
  backdrop-filter: var(--card-backdrop-blur);
  -webkit-backdrop-filter: var(--card-backdrop-blur);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--card-shadow);
  padding: var(--space-xl);
  margin-bottom: var(--space-xl);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
}

.chart-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.chart-wrapper {
  min-height: 300px;
  width: 100%;
  position: relative;
}

/* Responsive chart height */
@media (max-width: 768px) {
  .chart-wrapper {
    min-height: 250px;
  }
}
```

### 3.6 Export Buttons

**Visual Specifications:**
- Grouped button layout
- Icon + text for each format
- Hover and active states

**Complete CSS:**
```css
.export-buttons {
  display: flex;
  gap: var(--space-sm);
}

.export-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--border-base);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-base);
}

.export-btn:hover {
  background: var(--bg-secondary);
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: var(--card-shadow);
}

.export-btn:active {
  transform: translateY(0);
}

.export-btn-icon {
  font-size: 16px;
}

/* Mobile: Stack vertically */
@media (max-width: 480px) {
  .export-buttons {
    flex-direction: column;
    width: 100%;
  }

  .export-btn {
    width: 100%;
    justify-content: center;
  }
}
```

### 3.7 Loading State

**Complete CSS:**
```css
.report-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: var(--space-md);
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--border-base);
  border-top-color: var(--color-primary);
  border-radius: var(--radius-full);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.report-loading p {
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0;
}
```

### 3.8 Empty State

**Complete CSS:**
```css
.report-empty {
  background: var(--card-bg);
  backdrop-filter: var(--card-backdrop-blur);
  -webkit-backdrop-filter: var(--card-backdrop-blur);
  border: 2px dashed var(--card-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--card-shadow);
  padding: var(--space-3xl) var(--space-2xl);
  text-align: center;
  color: var(--text-secondary);
  margin: var(--space-xl) 0;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: var(--space-md);
  opacity: 0.5;
}

.report-empty h3 {
  color: var(--text-primary);
  margin: 0 0 var(--space-sm) 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
}

.report-empty p {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}
```

### 3.9 Error State

**Complete CSS:**
```css
.report-error {
  background: var(--card-bg);
  backdrop-filter: var(--card-backdrop-blur);
  -webkit-backdrop-filter: var(--card-backdrop-blur);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--card-shadow);
  padding: var(--space-3xl) var(--space-2xl);
  text-align: center;
  margin: var(--space-xl) 0;
}

.error-icon {
  font-size: 64px;
  margin-bottom: var(--space-md);
}

.report-error h3 {
  color: var(--text-primary);
  margin: 0 0 var(--space-sm) 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
}

.report-error p {
  margin: 0 0 var(--space-lg) 0;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}
```

---

## 4. Styling Guidelines

### 4.1 Color Usage for Financial Data

**Positive Values** (Revenue, Profit, Increase):
```css
.positive {
  color: var(--color-success); /* Green */
}
```

**Negative Values** (Expenses, Loss, Decrease):
```css
.negative {
  color: var(--color-danger); /* Red */
}
```

**Neutral Values** (Unchanged, Informational):
```css
.neutral {
  color: var(--text-secondary); /* Gray */
}
```

**Warning Values** (Late payments, Overdue):
```css
.warning {
  color: var(--color-warning); /* Amber/Yellow */
}
```

### 4.2 Typography Scale

| Element | Font Size | Font Weight | Use Case |
|---------|-----------|-------------|----------|
| Page Title | 42px | 700 | Report title |
| Section Title | 24px | 600 | Chart/table titles |
| Metric Value | 28px | 700 | KPI numbers |
| Metric Label | 14px | 500 | KPI labels |
| Table Header | 14px | 600 | Column headers |
| Table Cell | 14px | 400 | Data cells |
| Subtitle | 16px | 400 | Descriptions |
| Small Text | 12px | 500 | Footnotes, metadata |

### 4.3 Spacing Scale

```css
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 20px;
--space-xl: 24px;
--space-2xl: 32px;
--space-3xl: 48px;
```

**Usage:**
- Card padding: `var(--space-xl)` (24px)
- Section spacing: `var(--space-2xl)` (32px)
- Grid gaps: `var(--space-md)` (16px)
- Element gaps: `var(--space-sm)` (8px)

### 4.4 Border Radius

```css
--radius-sm: 6px;   /* Small elements */
--radius-md: 8px;   /* Buttons, inputs */
--radius-lg: 12px;  /* Medium cards */
--radius-xl: 16px;  /* Large cards, containers */
--radius-full: 9999px; /* Pills, badges */
```

### 4.5 Animations

**Slide Down (Page Header):**
```css
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.report-header {
  animation: slideDown 0.6s ease-out;
}
```

**Fade In (Metric Cards):**
```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.report-metrics-grid {
  animation: fadeIn 0.8s ease-out 0.2s both;
}
```

**Hover Lift (Cards):**
```css
.metric-card,
.chart-container,
.report-table-container {
  transition: all var(--transition-slower);
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--card-shadow-hover);
}
```

---

## 5. Data Visualization

### 5.1 Recommended Chart Library: **Recharts**

**Rationale:**
- Native React components (better integration)
- Responsive by default
- Clean, customizable design
- Lightweight and performant
- Good TypeScript support
- Easy to theme with CSS variables

**Installation:**
```bash
npm install recharts
```

### 5.2 Chart Types by Report

| Report | Primary Chart | Secondary Chart |
|--------|--------------|-----------------|
| Income Statement | Bar Chart (Revenue vs Expenses) | Line Chart (Trend over time) |
| Rent Collection | Progress/Gauge (Collection %) | Pie Chart (Status breakdown) |
| Cash Flow | Line Chart (Cash flow trend) | Waterfall Chart (Inflows/Outflows) |
| Occupancy & Revenue | Gauge (Occupancy %) | Bar Chart (Revenue by property) |

### 5.3 Chart Color Palette (Apple-Inspired)

**Primary Colors:**
```css
--chart-primary: #007AFF;    /* Blue */
--chart-success: #34C759;    /* Green */
--chart-warning: #FF9500;    /* Orange */
--chart-danger: #FF3B30;     /* Red */
--chart-secondary: #5856D6;  /* Purple */
--chart-teal: #5AC8FA;       /* Teal */
```

**Usage:**
- Revenue/Income: `--chart-success` (Green)
- Expenses: `--chart-danger` (Red)
- Cash Flow Positive: `--chart-success` (Green)
- Cash Flow Negative: `--chart-danger` (Red)
- Occupancy Rate: `--chart-primary` (Blue)
- Trends: `--chart-teal` (Teal)

### 5.4 Recharts Configuration Example

**Line Chart (Cash Flow Trend):**
```jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={cashFlowData}>
    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-base)" />
    <XAxis
      dataKey="month"
      stroke="var(--text-secondary)"
      style={{ fontSize: '14px' }}
    />
    <YAxis
      stroke="var(--text-secondary)"
      style={{ fontSize: '14px' }}
      tickFormatter={(value) => `$${value.toLocaleString()}`}
    />
    <Tooltip
      contentStyle={{
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: '8px',
        backdropFilter: 'blur(10px)'
      }}
      formatter={(value) => `$${value.toLocaleString()}`}
    />
    <Line
      type="monotone"
      dataKey="cashFlow"
      stroke="var(--chart-teal)"
      strokeWidth={3}
      dot={{ fill: 'var(--chart-teal)', r: 4 }}
    />
  </LineChart>
</ResponsiveContainer>
```

**Bar Chart (Revenue by Property):**
```jsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height={300}>
  <BarChart data={revenueData}>
    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-base)" />
    <XAxis
      dataKey="property"
      stroke="var(--text-secondary)"
      style={{ fontSize: '14px' }}
    />
    <YAxis
      stroke="var(--text-secondary)"
      style={{ fontSize: '14px' }}
      tickFormatter={(value) => `$${value.toLocaleString()}`}
    />
    <Tooltip
      contentStyle={{
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: '8px',
        backdropFilter: 'blur(10px)'
      }}
      formatter={(value) => `$${value.toLocaleString()}`}
    />
    <Bar dataKey="revenue" fill="var(--chart-success)" radius={[8, 8, 0, 0]} />
  </BarChart>
</ResponsiveContainer>
```

### 5.5 Accessibility for Charts

**ARIA Labels:**
```jsx
<div role="img" aria-label="Cash flow trend chart showing monthly cash flow from January to December">
  <ResponsiveContainer>
    {/* Chart content */}
  </ResponsiveContainer>
</div>
```

**Screen Reader Friendly Data Table:**
Provide a data table alternative below charts:
```jsx
<details>
  <summary>View data table</summary>
  <table className="sr-only">
    {/* Accessible table version of chart data */}
  </table>
</details>
```

---

## 6. Number Formatting

### 6.1 Currency Formatting

**JavaScript Utility:**
```javascript
// utils/formatters.js

export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Usage:
formatCurrency(1234.56) // "$1,234.56"
formatCurrency(-500.00) // "-$500.00"
```

**CSS for Tabular Numbers:**
```css
.currency {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum";
}
```

### 6.2 Percentage Formatting

**JavaScript Utility:**
```javascript
export const formatPercentage = (value, decimals = 1) => {
  return `${value.toFixed(decimals)}%`;
};

// Usage:
formatPercentage(85.5) // "85.5%"
formatPercentage(12.345, 2) // "12.35%"
```

### 6.3 Large Number Formatting (Compact)

**JavaScript Utility:**
```javascript
export const formatCompactNumber = (num) => {
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `$${(num / 1000).toFixed(1)}K`;
  }
  return formatCurrency(num);
};

// Usage:
formatCompactNumber(1234567) // "$1.2M"
formatCompactNumber(45000) // "$45.0K"
formatCompactNumber(500) // "$500.00"
```

### 6.4 Negative Number Display

**Option 1: Red Text with Minus Sign**
```jsx
<td className="currency negative-value">
  -$500.00
</td>
```

**Option 2: Parentheses (Accounting Style)**
```javascript
export const formatCurrencyAccounting = (amount) => {
  const formatted = formatCurrency(Math.abs(amount));
  return amount < 0 ? `(${formatted})` : formatted;
};

// Usage:
formatCurrencyAccounting(-500) // "($500.00)"
```

### 6.5 Number Alignment Rules

**In Tables:**
- **Numbers (currency, percentages):** Right-aligned
- **Labels/Text:** Left-aligned
- **Dates:** Left-aligned or centered

```css
.report-table th:first-child,
.report-table td:first-child {
  text-align: left; /* Labels */
}

.report-table th.numeric,
.report-table td.numeric {
  text-align: right; /* Numbers */
}
```

---

## 7. Responsive Behavior

### 7.1 Breakpoints

```css
/* Desktop: 1400px and above */
@media (min-width: 1400px) {
  /* Full layout */
}

/* Tablet: 768px to 1399px */
@media (min-width: 768px) and (max-width: 1399px) {
  /* Adjusted columns */
}

/* Mobile: Below 768px */
@media (max-width: 768px) {
  /* Stacked layout */
}

/* Small Mobile: Below 480px */
@media (max-width: 480px) {
  /* Single column */
}
```

### 7.2 Desktop Layout (1400px+)

```css
.report-page {
  max-width: 1400px;
  padding: var(--space-2xl);
}

.report-metrics-grid {
  grid-template-columns: repeat(4, 1fr); /* 4 columns */
}

.report-content {
  display: grid;
  grid-template-columns: 1fr 1fr; /* 2-column layout */
  gap: var(--space-xl);
}
```

### 7.3 Tablet Layout (768px - 1399px)

```css
@media (min-width: 768px) and (max-width: 1399px) {
  .report-page {
    padding: var(--space-xl);
  }

  .report-metrics-grid {
    grid-template-columns: repeat(2, 1fr); /* 2 columns */
  }

  .report-content {
    grid-template-columns: 1fr; /* Single column */
  }
}
```

### 7.4 Mobile Layout (< 768px)

```css
@media (max-width: 768px) {
  .report-page {
    padding: var(--space-md);
  }

  .report-title {
    font-size: 24px; /* Smaller title */
  }

  .report-header {
    flex-direction: column;
    align-items: stretch;
  }

  .report-metrics-grid {
    grid-template-columns: repeat(2, 1fr); /* 2 columns */
  }

  .metric-card {
    padding: var(--space-md);
  }

  .metric-value {
    font-size: 20px; /* Smaller values */
  }

  .report-filter-bar {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-md);
  }

  .filter-group {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-select {
    width: 100%;
  }

  /* Table: Horizontal scroll */
  .report-table-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .report-table {
    min-width: 600px;
  }
}
```

### 7.5 Small Mobile (< 480px)

```css
@media (max-width: 480px) {
  .report-metrics-grid {
    grid-template-columns: 1fr; /* Single column */
  }

  .export-buttons {
    flex-direction: column;
    width: 100%;
  }

  .export-btn {
    width: 100%;
    justify-content: center;
  }
}
```

### 7.6 Table Responsive Pattern

**Desktop/Tablet:** Horizontal scroll
```css
@media (max-width: 768px) {
  .report-table-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .report-table {
    min-width: 600px; /* Force minimum width */
  }
}
```

**Alternative: Card View (Optional for very narrow tables)**
```css
@media (max-width: 480px) {
  .report-table thead {
    display: none; /* Hide headers */
  }

  .report-table tbody tr {
    display: block;
    margin-bottom: var(--space-md);
    border: 1px solid var(--card-border);
    border-radius: var(--radius-md);
    padding: var(--space-md);
  }

  .report-table td {
    display: flex;
    justify-content: space-between;
    padding: var(--space-sm) 0;
    border-bottom: 1px solid var(--border-base);
  }

  .report-table td:before {
    content: attr(data-label);
    font-weight: var(--font-weight-semibold);
    color: var(--text-secondary);
  }
}
```

---

## 8. Code Examples

### 8.1 Complete MetricCard Component

**MetricCard.jsx:**
```jsx
import React from 'react';
import './MetricCard.css';

const MetricCard = ({ icon, value, label, trend, trendLabel, valueColor }) => {
  const getTrendClass = () => {
    if (!trend) return '';
    return trend > 0 ? 'positive' : trend < 0 ? 'negative' : '';
  };

  const getTrendIcon = () => {
    if (!trend) return '';
    return trend > 0 ? '↑' : trend < 0 ? '↓' : '→';
  };

  const formatTrendValue = (trend) => {
    return Math.abs(trend).toFixed(1);
  };

  return (
    <div className="metric-card">
      <div className="metric-icon">{icon}</div>
      <div className="metric-content">
        <div className={`metric-value ${valueColor || ''}`}>
          {value}
        </div>
        <div className="metric-label">{label}</div>
        {trend !== undefined && (
          <div className={`metric-trend ${getTrendClass()}`}>
            <span className="metric-trend-icon">{getTrendIcon()}</span>
            <span>{formatTrendValue(trend)}%</span>
            {trendLabel && <span className="metric-trend-label">{trendLabel}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
```

**Usage:**
```jsx
<MetricCard
  icon="💰"
  value="$45,230"
  label="Total Revenue"
  trend={12.5}
  trendLabel="vs last month"
/>

<MetricCard
  icon="📊"
  value="85.5%"
  label="Collection Rate"
  trend={-2.3}
  trendLabel="vs last month"
/>
```

### 8.2 Complete DataTable Component

**DataTable.jsx:**
```jsx
import React from 'react';
import './DataTable.css';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

const DataTable = ({ columns, data, showTotal = false, totalRow }) => {
  const renderCell = (column, row) => {
    const value = row[column.key];

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
    const classes = ['report-table-cell'];

    if (column.align === 'right') {
      classes.push('align-right');
    }

    if (column.type === 'currency' || column.type === 'percentage') {
      classes.push('currency');

      if (value > 0 && column.colorCode) {
        classes.push('positive-value');
      } else if (value < 0 && column.colorCode) {
        classes.push('negative-value');
      }
    }

    return classes.join(' ');
  };

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
            <tr key={index}>
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
                  {totalRow[column.key] !== undefined
                    ? column.type === 'currency'
                      ? formatCurrency(totalRow[column.key])
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
```

**Usage:**
```jsx
const columns = [
  { key: 'property', label: 'Property', align: 'left' },
  { key: 'revenue', label: 'Revenue', align: 'right', type: 'currency', colorCode: true },
  { key: 'expenses', label: 'Expenses', align: 'right', type: 'currency', colorCode: true },
  { key: 'netIncome', label: 'Net Income', align: 'right', type: 'currency', colorCode: true },
];

const data = [
  { property: '123 Main St', revenue: 2500, expenses: -800, netIncome: 1700 },
  { property: '456 Oak Ave', revenue: 3200, expenses: -1200, netIncome: 2000 },
];

const totalRow = {
  property: 'Total',
  revenue: 5700,
  expenses: -2000,
  netIncome: 3700,
};

<DataTable
  columns={columns}
  data={data}
  showTotal={true}
  totalRow={totalRow}
/>
```

### 8.3 Complete FilterBar Component

**FilterBar.jsx:**
```jsx
import React from 'react';
import './FilterBar.css';

const FilterBar = ({
  datePreset,
  onDatePresetChange,
  customStartDate,
  customEndDate,
  onCustomDateChange,
  properties,
  selectedProperties,
  onPropertyChange,
  onExport,
}) => {
  const datePresets = [
    { value: 'current-month', label: 'This Month' },
    { value: 'last-month', label: 'Last Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' },
  ];

  return (
    <div className="report-filter-bar">
      {/* Date Range Filter */}
      <div className="filter-group">
        <label htmlFor="date-preset" className="filter-label">
          Period:
        </label>
        <select
          id="date-preset"
          className="filter-select"
          value={datePreset}
          onChange={(e) => onDatePresetChange(e.target.value)}
        >
          {datePresets.map((preset) => (
            <option key={preset.value} value={preset.value}>
              {preset.label}
            </option>
          ))}
        </select>
      </div>

      {/* Custom Date Range (shown only when custom is selected) */}
      {datePreset === 'custom' && (
        <>
          <div className="filter-group">
            <label htmlFor="start-date" className="filter-label">
              From:
            </label>
            <input
              type="date"
              id="start-date"
              className="filter-input"
              value={customStartDate}
              onChange={(e) =>
                onCustomDateChange({ start: e.target.value, end: customEndDate })
              }
            />
          </div>
          <div className="filter-group">
            <label htmlFor="end-date" className="filter-label">
              To:
            </label>
            <input
              type="date"
              id="end-date"
              className="filter-input"
              value={customEndDate}
              onChange={(e) =>
                onCustomDateChange({ start: customStartDate, end: e.target.value })
              }
            />
          </div>
        </>
      )}

      {/* Property Filter (for multi-property owners) */}
      {properties && properties.length > 1 && (
        <div className="filter-group">
          <label htmlFor="property-filter" className="filter-label">
            Property:
          </label>
          <select
            id="property-filter"
            className="filter-select"
            value={selectedProperties}
            onChange={(e) => onPropertyChange(e.target.value)}
          >
            <option value="all">All Properties</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.address}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Export Buttons */}
      <div className="export-buttons">
        <button
          className="export-btn"
          onClick={() => onExport('pdf')}
          title="Export to PDF"
        >
          <span className="export-btn-icon">📄</span>
          <span>PDF</span>
        </button>
        <button
          className="export-btn"
          onClick={() => onExport('csv')}
          title="Export to CSV"
        >
          <span className="export-btn-icon">📊</span>
          <span>CSV</span>
        </button>
        <button
          className="export-btn"
          onClick={() => onExport('excel')}
          title="Export to Excel"
        >
          <span className="export-btn-icon">📈</span>
          <span>Excel</span>
        </button>
      </div>
    </div>
  );
};

export default FilterBar;
```

### 8.4 Utility Functions

**formatters.js:**
```javascript
// Currency Formatting
export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Percentage Formatting
export const formatPercentage = (value, decimals = 1) => {
  return `${value.toFixed(decimals)}%`;
};

// Compact Number Formatting
export const formatCompactNumber = (num) => {
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `$${(num / 1000).toFixed(1)}K`;
  }
  return formatCurrency(num);
};

// Accounting Style (Negative in Parentheses)
export const formatCurrencyAccounting = (amount) => {
  const formatted = formatCurrency(Math.abs(amount));
  return amount < 0 ? `(${formatted})` : formatted;
};

// Format Date Range Label
export const formatDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const options = { year: 'numeric', month: 'short', day: 'numeric' };

  return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
};

// Get Date Preset Range
export const getDatePresetRange = (preset) => {
  const today = new Date();
  let startDate, endDate;

  switch (preset) {
    case 'current-month':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      break;
    case 'last-month':
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      endDate = new Date(today.getFullYear(), today.getMonth(), 0);
      break;
    case 'quarter':
      const quarter = Math.floor(today.getMonth() / 3);
      startDate = new Date(today.getFullYear(), quarter * 3, 1);
      endDate = new Date(today.getFullYear(), quarter * 3 + 3, 0);
      break;
    case 'year':
      startDate = new Date(today.getFullYear(), 0, 1);
      endDate = new Date(today.getFullYear(), 11, 31);
      break;
    default:
      startDate = today;
      endDate = today;
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
};
```

---

## 9. Print Styles

### 9.1 Print Media Query

**Add to CSS:**
```css
@media print {
  /* Hide non-essential elements */
  .report-filter-bar,
  .export-buttons,
  .metric-card:hover,
  button,
  nav,
  footer {
    display: none !important;
  }

  /* Remove glassmorphism effects */
  .report-page,
  .metric-card,
  .report-table-container,
  .chart-container {
    background: white !important;
    backdrop-filter: none !important;
    box-shadow: none !important;
    border: 1px solid #ccc !important;
  }

  /* Optimize page breaks */
  .metric-card,
  .chart-container,
  .report-table-container {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  h1, h2, h3 {
    page-break-after: avoid;
    break-after: avoid;
  }

  /* Full width for print */
  .report-page {
    max-width: 100% !important;
    padding: 0 !important;
  }

  /* Black text for print */
  body {
    color: #000 !important;
  }

  /* Keep table formatting */
  .report-table {
    border-collapse: collapse;
  }

  .report-table th,
  .report-table td {
    border: 1px solid #ccc;
    padding: 8px;
  }

  /* Charts: Ensure they render */
  .chart-wrapper {
    min-height: 0 !important;
  }
}
```

---

## 10. Accessibility Guidelines

### 10.1 Semantic HTML

Use proper semantic elements:
```jsx
<main className="report-page">
  <header className="report-header">
    <h1 className="report-title">Income Statement</h1>
  </header>

  <section className="report-metrics">
    <h2 className="sr-only">Key Metrics</h2>
    {/* Metric cards */}
  </section>

  <section className="report-content">
    <h2>Detailed Breakdown</h2>
    {/* Tables and charts */}
  </section>
</main>
```

### 10.2 ARIA Labels

**For Interactive Elements:**
```jsx
<button
  className="export-btn"
  onClick={handleExport}
  aria-label="Export report to PDF format"
>
  <span aria-hidden="true">📄</span>
  <span>PDF</span>
</button>
```

**For Charts:**
```jsx
<div
  className="chart-wrapper"
  role="img"
  aria-label="Line chart showing cash flow trend from January to December 2025"
>
  <ResponsiveContainer>
    {/* Chart content */}
  </ResponsiveContainer>
</div>
```

### 10.3 Focus Indicators

```css
/* Visible focus states */
.filter-select:focus,
.filter-input:focus,
.export-btn:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Skip to content link */
.skip-to-content {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--color-primary);
  color: white;
  padding: 8px;
  text-decoration: none;
  z-index: 100;
}

.skip-to-content:focus {
  top: 0;
}
```

### 10.4 Screen Reader Only Class

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

---

## 11. Performance Optimization

### 11.1 Lazy Loading

**For Charts:**
```jsx
import React, { lazy, Suspense } from 'react';

const ReportChart = lazy(() => import('./components/ReportChart'));

function IncomeStatement() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ReportChart data={data} />
    </Suspense>
  );
}
```

### 11.2 Memoization

**For Expensive Calculations:**
```jsx
import React, { useMemo } from 'react';

function RentCollectionReport({ payments }) {
  const stats = useMemo(() => {
    return {
      total: payments.reduce((sum, p) => sum + p.amount, 0),
      completed: payments.filter(p => p.status === 'completed').length,
      pending: payments.filter(p => p.status === 'pending').length,
    };
  }, [payments]);

  return <MetricCard value={stats.total} />;
}
```

### 11.3 Pagination for Large Tables

```jsx
const ITEMS_PER_PAGE = 50;

function DataTable({ data }) {
  const [page, setPage] = useState(1);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return data.slice(start, start + ITEMS_PER_PAGE);
  }, [data, page]);

  return (
    <>
      <table>{/* Render paginatedData */}</table>
      <Pagination currentPage={page} onChange={setPage} />
    </>
  );
}
```

---

## 12. Testing Checklist

### 12.1 Visual Testing

- [ ] Page loads without layout shifts
- [ ] All glassmorphic effects render correctly
- [ ] Hover states work on all interactive elements
- [ ] Animations play smoothly (60fps)
- [ ] Charts render at correct size and aspect ratio
- [ ] Numbers are properly formatted
- [ ] Colors match design system (light and dark mode)

### 12.2 Responsive Testing

- [ ] Test on desktop (1920px, 1440px, 1366px)
- [ ] Test on tablet (1024px, 768px)
- [ ] Test on mobile (375px, 414px, 360px)
- [ ] Tables scroll horizontally on mobile
- [ ] Filter bar stacks vertically on mobile
- [ ] Metric cards adapt to 2-column then 1-column layout

### 12.3 Accessibility Testing

- [ ] Keyboard navigation works (Tab, Shift+Tab, Enter)
- [ ] Focus indicators are visible
- [ ] Screen reader announces all interactive elements
- [ ] Color contrast meets WCAG AA standards (4.5:1)
- [ ] Charts have text alternatives
- [ ] Form inputs have associated labels

### 12.4 Data Testing

- [ ] Handles empty data gracefully (shows empty state)
- [ ] Handles loading state (shows spinner)
- [ ] Handles errors (shows error message with retry)
- [ ] Large datasets don't freeze UI
- [ ] Negative numbers display correctly (red, parentheses)
- [ ] Currency formatting works for various locales

---

## Summary

This guide provides comprehensive front-end specifications for building 4 financial reports in Rent-Manager:

1. **Income Statement** - Revenue vs expenses with profit analysis
2. **Rent Collection Report** - Payment tracking and collection metrics
3. **Cash Flow Statement** - Cash inflow/outflow trends
4. **Occupancy & Revenue** - Vacancy tracking and revenue optimization

**Key Principles:**
- **Design System:** Apple-inspired glassmorphism with CSS variables
- **Components:** Reusable MetricCard, DataTable, FilterBar, ReportChart
- **Charts:** Recharts library with responsive configuration
- **Typography:** Tabular numbers, proper alignment, clear hierarchy
- **Responsive:** Mobile-first with graceful degradation
- **Accessibility:** WCAG AA compliant with ARIA labels and keyboard support
- **Performance:** Lazy loading, memoization, pagination for large datasets

**Next Steps:**
1. Set up shared components folder
2. Implement utility functions (formatters.js)
3. Build one report as reference (Income Statement)
4. Replicate pattern for remaining 3 reports
5. Test across devices and screen sizes
6. Validate accessibility with screen reader
7. Optimize performance with Chrome DevTools

---

**Document Version:** 1.0
**Last Updated:** October 28, 2025
**Maintained By:** Front-End Development Team
