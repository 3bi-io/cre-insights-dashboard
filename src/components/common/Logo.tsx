import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  linkTo?: string;
  className?: string;
  showAsLink?: boolean;
  variant?: 'light' | 'dark' | 'auto';
}

const sizeClasses = {
  xs: 'h-6 w-auto',
  sm: 'h-10 w-auto', 
  md: 'h-12 w-[300px] object-contain',
  lg: 'h-16 w-auto',
  xl: 'h-20 w-auto'
};

export const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  linkTo = '/', 
  className,
  showAsLink = true,
  variant = 'auto'
}) => {
  const { theme } = useTheme();
  
  // Determine which logo to use based on theme and variant
  const getLogoSrc = () => {
    if (variant === 'light') return '/intel-ats-logo-300x48.png';
    if (variant === 'dark') return '/intel-ats-logo-light.png';
    
    // Auto mode - use light text logo for dark themes, dark text logo for light themes
    if (theme === 'dark') return '/intel-ats-logo-light.png';
    return '/intel-ats-logo-300x48.png';
  };

  const logoElement = (
    <img 
      src={getLogoSrc()}
      alt="INTEL ATS"
      className={cn(sizeClasses[size], 'transition-opacity duration-200', className)}
    />
  );

  if (!showAsLink) {
    return logoElement;
  }

  return (
    <Link to={linkTo} className="flex items-center hover:opacity-80 transition-opacity">
      {logoElement}
    </Link>
  );
};

export default Logo;