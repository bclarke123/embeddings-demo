import React from 'react';
import { colors } from '../styles/theme';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({ 
  variant = 'primary', 
  loading = false, 
  icon,
  children, 
  disabled,
  style,
  ...props 
}: ButtonProps) {
  const baseStyles: React.CSSProperties = {
    padding: "12px 20px",
    border: "none",
    borderRadius: "8px",
    cursor: disabled || loading ? "not-allowed" : "pointer",
    fontSize: "16px",
    fontWeight: 500,
    transition: "all 0.2s",
    whiteSpace: "nowrap",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    flexShrink: 0,
    opacity: disabled || loading ? 0.5 : 1,
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: colors.primary[600],
      color: "white",
    },
    secondary: {
      background: colors.gray[900],
      color: colors.gray[300],
      border: `1px solid ${colors.gray[700]}`,
    },
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      style={{
        ...baseStyles,
        ...variantStyles[variant],
        ...style,
      }}
    >
      {icon}
      {loading ? "Loading..." : children}
    </button>
  );
}