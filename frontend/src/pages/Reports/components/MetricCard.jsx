import React from 'react';
import './MetricCard.css';

/**
 * MetricCard - Displays a KPI metric with optional trend indicator
 *
 * @param {string} icon - Emoji or icon to display
 * @param {string} value - The metric value (pre-formatted)
 * @param {string} label - Label describing the metric
 * @param {number} trend - Optional: percentage change (positive or negative)
 * @param {string} trendLabel - Optional: label for trend (e.g., "vs last month")
 * @param {string} valueColor - Optional: color class for value ('positive', 'negative', 'neutral')
 */
const MetricCard = ({ icon, value, label, trend, trendLabel, valueColor }) => {
  const getTrendClass = () => {
    if (trend === null || trend === undefined) return '';
    return trend > 0 ? 'positive' : trend < 0 ? 'negative' : 'neutral';
  };

  const getTrendIcon = () => {
    if (trend === null || trend === undefined) return '';
    return trend > 0 ? '↑' : trend < 0 ? '↓' : '→';
  };

  const formatTrendValue = (trend) => {
    if (trend === null || trend === undefined) return '';
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
        {(trend !== undefined && trend !== null) && (
          <div className={`metric-trend ${getTrendClass()}`}>
            <span className="metric-trend-icon">{getTrendIcon()}</span>
            <span>{formatTrendValue(trend)}%</span>
            {trendLabel && <span className="metric-trend-label"> {trendLabel}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
