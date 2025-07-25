import React from 'react';
import { colors } from './theme';

export function GlobalStyles() {
  React.useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      * {
        box-sizing: border-box;
      }
      
      body {
        margin: 0;
        background-color: ${colors.gray[950]};
      }
      
      input:focus, textarea:focus {
        border-color: ${colors.primary[600]} !important;
        box-shadow: 0 0 0 3px ${colors.primary[600]}1A !important;
      }
      
      button:hover:not(:disabled) {
        background-color: ${colors.primary[700]} !important;
      }
      
      button:active:not(:disabled) {
        transform: translateY(1px);
      }
      
      ::selection {
        background-color: ${colors.primary[600]}4D;
        color: white;
      }
      
      /* Custom scrollbar */
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      
      ::-webkit-scrollbar-track {
        background: ${colors.gray[900]};
      }
      
      ::-webkit-scrollbar-thumb {
        background: ${colors.gray[700]};
        border-radius: 4px;
      }
      
      ::-webkit-scrollbar-thumb:hover {
        background: ${colors.gray[600]};
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  return null;
}