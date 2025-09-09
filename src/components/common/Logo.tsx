import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  linkTo?: string;
  className?: string;
  showAsLink?: boolean;
}

const sizeClasses = {
  xs: 'h-6 w-auto',
  sm: 'h-10 w-auto', 
  md: 'h-14 w-[280px] object-contain',
  lg: 'h-16 w-auto',
  xl: 'h-20 w-auto'
};

export const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  linkTo = '/', 
  className,
  showAsLink = true 
}) => {
  const logoElement = (
    <img 
      src="/intel-ats-logo-280x56.png" 
      alt="INTEL ATS"
      className={cn(sizeClasses[size], className)}
    />
  );

  if (!showAsLink) {
    return logoElement;
  }

  return (
    <Link to={linkTo} className="flex items-center">
      {logoElement}
    </Link>
  );
};

export default Logo;