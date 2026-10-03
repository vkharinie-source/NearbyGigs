import React from 'react';
import './Card.css';

export const Card = ({ children, className = '', elevated = false, onClick }) => {
  const baseClass = 'ui-card';
  const elevationClass = elevated ? 'ui-card-elevated' : '';
  const interactiveClass = onClick ? 'ui-card-interactive' : '';

  return (
    <div
      className={`${baseClass} ${elevationClass} ${interactiveClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
