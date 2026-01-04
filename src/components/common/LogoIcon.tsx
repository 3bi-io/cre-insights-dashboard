import React from 'react';
import { cn } from '@/lib/utils';

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
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("flex-shrink-0", className)}
      aria-hidden="true"
    >
      {/* Rounded square background */}
      <rect
        x="2"
        y="2"
        width="28"
        height="28"
        rx="6"
        className="fill-primary"
      />
      {/* Voice/soundwave bars - representing AI voice technology */}
      <rect
        x="8"
        y="12"
        width="3"
        height="8"
        rx="1.5"
        className="fill-primary-foreground"
      />
      <rect
        x="14.5"
        y="8"
        width="3"
        height="16"
        rx="1.5"
        className="fill-primary-foreground"
      />
      <rect
        x="21"
        y="10"
        width="3"
        height="12"
        rx="1.5"
        className="fill-primary-foreground"
      />
    </svg>
  );
};

export default LogoIcon;
