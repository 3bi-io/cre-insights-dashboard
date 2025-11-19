import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/ThemeProvider';

interface BrandProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  linkTo?: string;
  className?: string;
  showAsLink?: boolean;
}

const sizeHeights = {
  xs: 'h-6',  // 24px
  sm: 'h-8',  // 32px
  md: 'h-10', // 40px
  lg: 'h-12', // 48px
  xl: 'h-16'  // 64px
};

export const Brand: React.FC<BrandProps> = ({ 
  size = 'md', 
  linkTo = '/', 
  className,
  showAsLink = true
}) => {
  const { theme } = useTheme();
  
  // Determine if dark mode is active
  const isDarkMode = theme === 'dark' || 
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const logoSrc = isDarkMode ? '/logo-white.png' : '/logo.png';
  
  const brandElement = (
    <img 
      src={logoSrc}
      alt="ATS.me"
      className={cn(
        "w-auto transition-all duration-200",
        sizeHeights[size],
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