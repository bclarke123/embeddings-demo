import React from 'react';
import { colors, spacing, typography } from '../styles/theme';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Semantic Search</h1>
        <p style={styles.subtitle}>Search through your documents using natural language</p>
      </div>
      <div style={styles.content}>
        {children}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: colors.gray[950],
    color: colors.gray[100],
    fontFamily: typography.fontFamily,
  },
  header: {
    textAlign: "center" as const,
    padding: `${spacing.xxxl} ${spacing.xl} ${spacing.xxl}`,
    borderBottom: `1px solid ${colors.gray[800]}`,
  },
  title: {
    fontSize: "36px",
    fontWeight: 600,
    color: colors.gray[25],
    margin: `0 0 ${spacing.sm} 0`,
    letterSpacing: "-0.02em",
  },
  subtitle: {
    fontSize: "16px",
    color: colors.gray[400],
    margin: 0,
  },
  content: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: `0 ${spacing.xl} ${spacing.xxxl}`,
  },
};