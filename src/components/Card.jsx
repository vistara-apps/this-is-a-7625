import React from 'react';

export function Card({ children, className = '', variant = 'default' }) {
  const baseClasses = 'glass-card rounded-lg transition-all duration-200';
  
  const variantClasses = {
    default: '',
    elevated: 'shadow-card hover:shadow-modal'
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
}