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
  xs: 'text-lg',
  sm: 'text-xl', 
  md: 'text-2xl',
  lg: 'text-3xl',
  xl: 'text-4xl'
};

export const Brand: React.FC<BrandProps> = ({ 
  size = 'md', 
  linkTo = '/', 
  className,
  showAsLink = true
}) => {
  const brandElement = (
    <span 
      className={cn(
        "font-bold text-primary transition-all duration-200",
        sizeClasses[size],
        className
      )}
    >
      ATS.me
    </span>
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