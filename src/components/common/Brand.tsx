import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface BrandProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  linkTo?: string;
  className?: string;
  showAsLink?: boolean;
}

const sizeClasses = {
  xs: 'h-6',
  sm: 'h-8', 
  md: 'h-10',
  lg: 'h-12',
  xl: 'h-16'
};

export const Brand: React.FC<BrandProps> = ({ 
  size = 'md', 
  linkTo = '/', 
  className,
  showAsLink = true
}) => {
  const brandElement = (
    <img 
      src="/logo.png" 
      alt="ATS.me" 
      className={cn(
        "w-auto object-contain transition-all duration-200 hover:opacity-90",
        sizeClasses[size],
        className
      )}
    />
  );

  if (!showAsLink) {
    return brandElement;
  }

  return (
    <Link 
      to={linkTo} 
      className="flex items-center hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
    >
      {brandElement}
    </Link>
  );
};

export default Brand;