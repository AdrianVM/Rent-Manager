import React from 'react';
import './Logo.css';

/**
 * AVM Property Management Logo Component
 *
 * Features:
 * - Modern property/building icon representing real estate
 * - Gradient colors from brand palette (Royal Blue to Teal)
 * - Scalable SVG for crisp rendering at any size
 * - Optional text display
 * - Multiple size variants
 *
 * @param {string} size - Logo size: 'small', 'medium', 'large', 'xlarge'
 * @param {boolean} showText - Whether to show the "AVM" text
 * @param {boolean} showSubtext - Whether to show "Property Management" subtext
 * @param {string} variant - Logo variant: 'full', 'icon-only', 'text-only'
 */
function Logo({
  size = 'medium',
  showText = true,
  showSubtext = false,
  variant = 'full',
  className = ''
}) {

  const sizeMap = {
    small: { icon: 32, text: 16 },
    medium: { icon: 48, text: 24 },
    large: { icon: 64, text: 32 },
    xlarge: { icon: 96, text: 48 }
  };

  const dimensions = sizeMap[size] || sizeMap.medium;

  // Icon only variant
  if (variant === 'icon-only') {
    return (
      <div className={`logo-container logo-icon-only ${className}`}>
        <svg
          width={dimensions.icon}
          height={dimensions.icon}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="logo-icon"
        >
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1F4E79" />
              <stop offset="100%" stopColor="#1CA9A3" />
            </linearGradient>
            <linearGradient id="logoGradientAccent" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1CA9A3" />
              <stop offset="100%" stopColor="#F28C28" />
            </linearGradient>
          </defs>

          {/* Modern building icon with layered design */}
          <g>
            {/* Main building structure */}
            <rect x="12" y="18" width="40" height="42" rx="3" fill="url(#logoGradient)" opacity="0.95"/>

            {/* Building windows - left side */}
            <rect x="18" y="24" width="6" height="6" rx="1" fill="white" opacity="0.9"/>
            <rect x="18" y="33" width="6" height="6" rx="1" fill="white" opacity="0.9"/>
            <rect x="18" y="42" width="6" height="6" rx="1" fill="white" opacity="0.9"/>

            {/* Building windows - right side */}
            <rect x="40" y="24" width="6" height="6" rx="1" fill="white" opacity="0.9"/>
            <rect x="40" y="33" width="6" height="6" rx="1" fill="white" opacity="0.9"/>
            <rect x="40" y="42" width="6" height="6" rx="1" fill="white" opacity="0.9"/>

            {/* Center entrance/door */}
            <rect x="28" y="48" width="8" height="12" rx="1" fill="url(#logoGradientAccent)"/>

            {/* Roof/top accent */}
            <path
              d="M10 18 L32 8 L54 18 L52 18 L32 10 L12 18 Z"
              fill="url(#logoGradientAccent)"
            />

            {/* Decorative layers (representing property layers/floors) */}
            <line x1="12" y1="30" x2="52" y2="30" stroke="white" strokeWidth="0.5" opacity="0.3"/>
            <line x1="12" y1="39" x2="52" y2="39" stroke="white" strokeWidth="0.5" opacity="0.3"/>
            <line x1="12" y1="48" x2="52" y2="48" stroke="white" strokeWidth="0.5" opacity="0.3"/>
          </g>
        </svg>
      </div>
    );
  }

  // Text only variant
  if (variant === 'text-only') {
    return (
      <div className={`logo-container logo-text-only ${className}`}>
        <div className="logo-text-group">
          <h1 className="logo-text" style={{ fontSize: dimensions.text }}>AVM</h1>
          {showSubtext && (
            <p className="logo-subtext" style={{ fontSize: dimensions.text * 0.4 }}>
              Property Management
            </p>
          )}
        </div>
      </div>
    );
  }

  // Full logo (icon + text)
  return (
    <div className={`logo-container logo-full ${className}`}>
      <svg
        width={dimensions.icon}
        height={dimensions.icon}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="logo-icon"
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1F4E79" />
            <stop offset="100%" stopColor="#1CA9A3" />
          </linearGradient>
          <linearGradient id="logoGradientAccent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1CA9A3" />
            <stop offset="100%" stopColor="#F28C28" />
          </linearGradient>
        </defs>

        {/* Modern building icon with layered design */}
        <g>
          {/* Main building structure */}
          <rect x="12" y="18" width="40" height="42" rx="3" fill="url(#logoGradient)" opacity="0.95"/>

          {/* Building windows - left side */}
          <rect x="18" y="24" width="6" height="6" rx="1" fill="white" opacity="0.9"/>
          <rect x="18" y="33" width="6" height="6" rx="1" fill="white" opacity="0.9"/>
          <rect x="18" y="42" width="6" height="6" rx="1" fill="white" opacity="0.9"/>

          {/* Building windows - right side */}
          <rect x="40" y="24" width="6" height="6" rx="1" fill="white" opacity="0.9"/>
          <rect x="40" y="33" width="6" height="6" rx="1" fill="white" opacity="0.9"/>
          <rect x="40" y="42" width="6" height="6" rx="1" fill="white" opacity="0.9"/>

          {/* Center entrance/door */}
          <rect x="28" y="48" width="8" height="12" rx="1" fill="url(#logoGradientAccent)"/>

          {/* Roof/top accent */}
          <path
            d="M10 18 L32 8 L54 18 L52 18 L32 10 L12 18 Z"
            fill="url(#logoGradientAccent)"
          />

          {/* Decorative layers (representing property layers/floors) */}
          <line x1="12" y1="30" x2="52" y2="30" stroke="white" strokeWidth="0.5" opacity="0.3"/>
          <line x1="12" y1="39" x2="52" y2="39" stroke="white" strokeWidth="0.5" opacity="0.3"/>
          <line x1="12" y1="48" x2="52" y2="48" stroke="white" strokeWidth="0.5" opacity="0.3"/>
        </g>
      </svg>

      {showText && (
        <div className="logo-text-group">
          <h1 className="logo-text" style={{ fontSize: dimensions.text }}>AVM</h1>
          {showSubtext && (
            <p className="logo-subtext" style={{ fontSize: dimensions.text * 0.4 }}>
              Property Management
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default Logo;
