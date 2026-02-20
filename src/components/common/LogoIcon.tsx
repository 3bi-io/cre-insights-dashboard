import React from 'react';
import { cn } from '@/lib/utils';
import logoIcon from '@/assets/logo-icon.png';

interface LogoIconProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  xs: 16,
  sm: 24,
  md: 32,
  lg: 40,
  xl: 48,
};

export const LogoIcon: React.FC<LogoIconProps> = ({ size = 'md', className }) => {
  const pixelSize = sizeMap[size];
  
  return (
    <img
      src={logoIcon}
      alt="Apply AI logo"
      width={pixelSize}
      height={pixelSize}
      className={cn("flex-shrink-0 object-contain", className)}
    />
  );
};

export default LogoIcon;
