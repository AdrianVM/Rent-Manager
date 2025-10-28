/**
 * Utility functions for formatting numbers, currency, percentages, and dates
 * Used across all financial reports
 */

/**
 * Format a number as currency
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (default: USD)
 * @param {string} locale - Locale for formatting (default: en-US)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$0.00';
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format a number as percentage
 * @param {number} value - The percentage value
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.0%';
  }

  return `${value.toFixed(decimals)}%`;
};

/**
 * Format large numbers in compact form (1.2M, 45.0K)
 * @param {number} num - The number to format
 * @returns {string} Compact formatted number
 */
export const formatCompactNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) {
    return '$0';
  }

  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (absNum >= 1000000) {
    return `${sign}$${(absNum / 1000000).toFixed(1)}M`;
  } else if (absNum >= 1000) {
    return `${sign}$${(absNum / 1000).toFixed(1)}K`;
  }

  return formatCurrency(num);
};

/**
 * Format currency in accounting style (negative values in parentheses)
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrencyAccounting = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$0.00';
  }

  const formatted = formatCurrency(Math.abs(amount));
  return amount < 0 ? `(${formatted})` : formatted;
};

/**
 * Format a date range as a readable string
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {string} Formatted date range
 */
export const formatDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const options = { year: 'numeric', month: 'short', day: 'numeric' };

  return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
};

/**
 * Get date range for preset periods
 * @param {string} preset - Preset period (current-month, last-month, quarter, year)
 * @returns {object} Object with startDate and endDate strings (YYYY-MM-DD)
 */
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

    case 'last-year':
      startDate = new Date(today.getFullYear() - 1, 0, 1);
      endDate = new Date(today.getFullYear() - 1, 11, 31);
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

/**
 * Get a human-readable label for date preset
 * @param {string} preset - Preset period
 * @returns {string} Human-readable label
 */
export const getDatePresetLabel = (preset) => {
  const labels = {
    'current-month': 'This Month',
    'last-month': 'Last Month',
    'quarter': 'This Quarter',
    'year': 'This Year',
    'last-year': 'Last Year',
    'custom': 'Custom Range',
  };

  return labels[preset] || preset;
};

/**
 * Format a number with thousands separators
 * @param {number} num - The number to format
 * @returns {string} Formatted number
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }

  return num.toLocaleString('en-US');
};

/**
 * Calculate percentage change between two values
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {number} Percentage change (null if previous is 0)
 */
export const calculatePercentageChange = (current, previous) => {
  if (previous === 0 || previous === null || previous === undefined) {
    return null;
  }

  return ((current - previous) / Math.abs(previous)) * 100;
};

/**
 * Determine if a value is positive, negative, or neutral
 * @param {number} value - The value to check
 * @returns {string} 'positive', 'negative', or 'neutral'
 */
export const getValueType = (value) => {
  if (value > 0) return 'positive';
  if (value < 0) return 'negative';
  return 'neutral';
};
