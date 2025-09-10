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
    <div className={cn(
      "font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent",
      sizeClasses[size],
      "transition-all duration-200 hover:from-primary/90 hover:to-primary/70",
      className
    )}>
      ATS INTEL
    </div>
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