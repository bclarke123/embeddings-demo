import React from 'react';
import { colors } from '../styles/theme';

interface AlertProps {
  variant: 'info' | 'success' | 'error';
  children: React.ReactNode;
}

export function Alert({ variant, children }: AlertProps) {
  const baseStyles: React.CSSProperties = {
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "14px",
    border: "1px solid",
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    info: {
      background: colors.gray[900],
      borderColor: colors.gray[700],
      color: colors.gray[300],
    },
    success: {
      background: colors.success[900] + "1A",
      borderColor: colors.success[700],
      color: colors.success[300],
    },
    error: {
      background: colors.error[900] + "1A",
      borderColor: colors.error[700],
      color: colors.error[300],
    },
  };

  return (
    <div style={{ ...baseStyles, ...variantStyles[variant] }}>
      {children}
    </div>
  );
}