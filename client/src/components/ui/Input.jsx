import React from 'react';
import './Input.css';

export const Input = React.forwardRef(({ 
  label, 
  error, 
  icon, 
  className = '', 
  id, 
  ...props 
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div className={`ui-input-group ${className}`}>
      {label && (
        <label htmlFor={inputId} className="ui-input-label">
          {label}
        </label>
      )}
      
      <div className="ui-input-wrapper">
        {icon && <span className="ui-input-icon">{icon}</span>}
        <input
          ref={ref}
          id={inputId}
          className={`ui-input ${icon ? 'ui-input-with-icon' : ''} ${error ? 'ui-input-error' : ''}`}
          {...props}
        />
      </div>
      
      {error && <span className="ui-input-error-message">{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';
