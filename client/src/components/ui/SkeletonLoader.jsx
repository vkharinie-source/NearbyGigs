import React from 'react';
import './SkeletonLoader.css';

export const Skeleton = ({ className = '', type = 'line', ...props }) => {
  return (
    <div className={`ui-skeleton ui-skeleton-${type} ${className}`} {...props}></div>
  );
};
