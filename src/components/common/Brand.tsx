import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface BrandProps {
  variant?: 'horizontal' | 'icon' | 'text';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  theme?: 'light' | 'dark' | 'auto';
  linkTo?: string;
  className?: string;
  showAsLink?: boolean;
}

const sizeMap = {
  xs: { height: 'h-4', width: 'w-auto' },
  sm: { height: 'h-6', width: 'w-auto' },
  md: { height: 'h-8', width: 'w-auto' },
  lg: { height: 'h-10', width: 'w-auto' },
  xl: { height: 'h-12', width: 'w-auto' }
};

const iconSizeMap = {
  xs: { height: 'h-4', width: 'w-4' },
  sm: { height: 'h-6', width: 'w-6' },
  md: { height: 'h-8', width: 'w-8' },
  lg: { height: 'h-10', width: 'w-10' },
  xl: { height: 'h-12', width: 'w-12' }
};

export const Brand: React.FC<BrandProps> = ({ 
  variant = 'horizontal',
  size = 'md', 
  theme = 'auto',
  linkTo = '/', 
  className,
  showAsLink = true
}) => {
  const sizeClasses = variant === 'icon' ? iconSizeMap[size] : sizeMap[size];
  
  const getLogo = () => {
    if (variant === 'text') {
      return (
        <span className="font-bold text-primary text-xl">
          ATS.me
        </span>
      );
    }

    if (variant === 'icon') {
      return (
        <img 
          src="/logo-icon.png" 
          alt="ATS.me" 
          className={cn(sizeClasses.height, sizeClasses.width, "object-contain")}
        />
      );
    }

    // Horizontal logo
    const logoSrc = theme === 'dark' 
      ? '/logo-white.png' 
      : theme === 'light'
      ? '/logo.png'
      : '/logo.png'; // Auto defaults to regular logo (works on both themes)

    return (
      <img 
        src={logoSrc}
        alt="ATS.me" 
        className={cn(sizeClasses.height, sizeClasses.width, "object-contain dark:hidden")}
      />
    );
  };

  const brandElement = (
    <div className={cn("flex items-center", className)}>
      {getLogo()}
      {theme === 'auto' && variant === 'horizontal' && (
        <img 
          src="/logo-white.png"
          alt="ATS.me" 
          className={cn(sizeClasses.height, sizeClasses.width, "object-contain hidden dark:block")}
        />
      )}
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