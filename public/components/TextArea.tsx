import React from 'react';
import { colors } from '../styles/theme';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function TextArea({ label, style, ...props }: TextAreaProps) {
  const textareaStyles: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    fontSize: "16px",
    border: `1px solid ${colors.gray[700]}`,
    borderRadius: "8px",
    background: colors.gray[900],
    color: colors.gray[100],
    outline: "none",
    transition: "border-color 0.2s",
    minHeight: "300px",
    resize: "vertical",
    fontFamily: "inherit",
    boxSizing: "border-box",
  };

  const wrapperStyles: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  };

  const labelStyles: React.CSSProperties = {
    fontSize: "14px",
    fontWeight: 500,
    color: colors.gray[300],
  };

  return (
    <div style={wrapperStyles}>
      {label && <label style={labelStyles}>{label}</label>}
      <textarea {...props} style={{ ...textareaStyles, ...style }} />
    </div>
  );
}