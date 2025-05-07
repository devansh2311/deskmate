import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  hoverable = false,
  bordered = true,
  shadow = 'md',
  padding = 'md',
  ...props 
}) => {
  const baseClasses = 'bg-white rounded-lg overflow-hidden';
  
  const hoverClasses = hoverable ? 'transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg' : '';
  const borderClasses = bordered ? 'border border-gray-200' : '';
  
  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  };
  
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  };
  
  const cardClasses = `${baseClasses} ${hoverClasses} ${borderClasses} ${shadowClasses[shadow]} ${paddingClasses[padding]} ${className}`;
  
  return (
    <div className={cardClasses} {...props}>
      {children}
    </div>
  );
};

// Card subcomponents
Card.Header = ({ children, className = '', ...props }) => (
  <div className={`mb-4 pb-3 border-b border-gray-200 ${className}`} {...props}>
    {children}
  </div>
);

Card.Title = ({ children, className = '', ...props }) => (
  <h3 className={`text-xl font-bold text-gray-800 ${className}`} {...props}>
    {children}
  </h3>
);

Card.Subtitle = ({ children, className = '', ...props }) => (
  <p className={`text-sm text-gray-600 mt-1 ${className}`} {...props}>
    {children}
  </p>
);

Card.Body = ({ children, className = '', ...props }) => (
  <div className={className} {...props}>
    {children}
  </div>
);

Card.Footer = ({ children, className = '', ...props }) => (
  <div className={`mt-4 pt-3 border-t border-gray-200 ${className}`} {...props}>
    {children}
  </div>
);

Card.Image = ({ src, alt = '', className = '', ...props }) => (
  <img 
    src={src} 
    alt={alt} 
    className={`w-full object-cover ${className}`} 
    {...props} 
  />
);

export default Card;
