import React from 'react';
import { colors, spacing } from '../styles/theme';
import { Button } from './Button';

interface NavigationProps {
  activeMode: 'search' | 'upload';
  onModeChange: (mode: 'search' | 'upload') => void;
}

export function Navigation({ activeMode, onModeChange }: NavigationProps) {
  const SearchIcon = (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path 
        d="M17.5 17.5L14.5834 14.5833M16.6667 9.58333C16.6667 13.4954 13.4954 16.6667 9.58333 16.6667C5.67132 16.6667 2.5 13.4954 2.5 9.58333C2.5 5.67132 5.67132 2.5 9.58333 2.5C13.4954 2.5 16.6667 5.67132 16.6667 9.58333Z" 
        stroke="currentColor" 
        strokeWidth="1.66667" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );

  const UploadIcon = (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path 
        d="M6.66667 13.3333L10 10M10 10L13.3333 13.3333M10 10V17.5M16.6667 13.9524C17.6846 13.1117 18.3333 11.8399 18.3333 10.4167C18.3333 7.88536 16.2813 5.83333 13.75 5.83333C13.5679 5.83333 13.3975 5.73833 13.3051 5.58145C12.2184 3.73736 10.212 2.5 7.91667 2.5C4.46489 2.5 1.66667 5.29822 1.66667 8.75C1.66667 10.4718 2.36287 12.0309 3.48912 13.1613" 
        stroke="currentColor" 
        strokeWidth="1.66667" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <div style={styles.nav}>
      <Button
        variant={activeMode === 'search' ? 'primary' : 'secondary'}
        onClick={() => onModeChange('search')}
        icon={SearchIcon}
        style={styles.navButton}
      >
        Search
      </Button>
      <Button
        variant={activeMode === 'upload' ? 'primary' : 'secondary'}
        onClick={() => onModeChange('upload')}
        icon={UploadIcon}
        style={styles.navButton}
      >
        Upload
      </Button>
    </div>
  );
}

const styles = {
  nav: {
    display: "flex",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.xl,
  },
  navButton: {
    minWidth: "120px",
  },
};