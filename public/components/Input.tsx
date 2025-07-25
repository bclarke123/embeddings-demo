import React from 'react';
import { colors } from '../styles/theme';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
}

export function Input({ label, icon, style, ...props }: InputProps) {
  const inputStyles: React.CSSProperties = {
    width: "100%",
    padding: icon ? "12px 12px 12px 44px" : "12px 14px",
    fontSize: "16px",
    border: `1px solid ${colors.gray[700]}`,
    borderRadius: "8px",
    background: colors.gray[900],
    color: colors.gray[100],
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  };

  const wrapperStyles: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    position: "relative",
    width: "100%",
  };

  const iconStyles: React.CSSProperties = {
    position: "absolute",
    left: "14px",
    top: label ? "36px" : "50%",
    transform: label ? "none" : "translateY(-50%)",
    pointerEvents: "none",
  };

  const labelStyles: React.CSSProperties = {
    fontSize: "14px",
    fontWeight: 500,
    color: colors.gray[300],
  };

  return (
    <div style={wrapperStyles}>
      {label && <label style={labelStyles}>{label}</label>}
      <div style={{ position: "relative" }}>
        {icon && <div style={iconStyles}>{icon}</div>}
        <input {...props} style={{ ...inputStyles, ...style }} />
      </div>
    </div>
  );
}