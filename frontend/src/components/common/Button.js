import React from 'react';

const baseButtonStyle = {
  padding: '12px 24px',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '600',
  transition: 'all 0.3s ease',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  fontFamily: 'Inter, sans-serif',
};

const disabledStyle = {
  opacity: 0.6,
  cursor: 'not-allowed',
};

export function PrimaryButton({ children, onClick, disabled, type = 'button', style, className = '' }) {
  const [isHovered, setIsHovered] = React.useState(false);

  const primaryStyle = {
    ...baseButtonStyle,
    background: isHovered && !disabled
      ? 'linear-gradient(135deg, #1a4269, #178e89)'
      : 'linear-gradient(135deg, #1F4E79, #1CA9A3)',
    color: 'white',
    boxShadow: isHovered && !disabled
      ? '0 4px 16px rgba(31, 78, 121, 0.3)'
      : '0 2px 8px rgba(31, 78, 121, 0.2)',
    transform: isHovered && !disabled ? 'translateY(-1px)' : 'translateY(0)',
    ...(disabled && disabledStyle),
    ...style,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={primaryStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, onClick, disabled, type = 'button', style, className = '' }) {
  const [isHovered, setIsHovered] = React.useState(false);

  const secondaryStyle = {
    ...baseButtonStyle,
    backgroundColor: isHovered && !disabled ? '#178e89' : '#1CA9A3',
    color: 'white',
    boxShadow: isHovered && !disabled
      ? '0 4px 12px rgba(28, 169, 163, 0.3)'
      : '0 2px 6px rgba(28, 169, 163, 0.2)',
    transform: isHovered && !disabled ? 'translateY(-1px)' : 'translateY(0)',
    ...(disabled && disabledStyle),
    ...style,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={secondaryStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </button>
  );
}

export function DangerButton({ children, onClick, disabled, type = 'button', style, className = '' }) {
  const [isHovered, setIsHovered] = React.useState(false);

  const dangerStyle = {
    ...baseButtonStyle,
    backgroundColor: isHovered && !disabled ? '#c82333' : '#dc3545',
    color: 'white',
    boxShadow: isHovered && !disabled
      ? '0 4px 12px rgba(220, 53, 69, 0.3)'
      : '0 2px 6px rgba(220, 53, 69, 0.2)',
    transform: isHovered && !disabled ? 'translateY(-1px)' : 'translateY(0)',
    ...(disabled && disabledStyle),
    ...style,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={dangerStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </button>
  );
}
