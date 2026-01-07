import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { LazyImage } from '@/components/optimized/LazyImage';
import { LogoIcon } from './LogoIcon';
interface BrandProps {
  variant?: 'horizontal' | 'icon' | 'text' | 'auto';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'auto';
  theme?: 'light' | 'dark' | 'auto';
  linkTo?: string;
  className?: string;
  showAsLink?: boolean;
  priority?: boolean;
  customLogoUrl?: string | null;
  organizationName?: string;
}
const textSizeMap = {
  xs: 'text-sm',
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
  xl: 'text-2xl'
};
const iconSizeMap = {
  xs: 'xs' as const,
  sm: 'sm' as const,
  md: 'md' as const,
  lg: 'lg' as const,
  xl: 'xl' as const
};
export const Brand: React.FC<BrandProps> = ({
  variant: propVariant = 'horizontal',
  size: propSize = 'md',
  theme = 'auto',
  linkTo = '/',
  className,
  showAsLink = true,
  priority = false,
  customLogoUrl,
  organizationName = 'ATS.me'
}) => {
  const {
    isMobile,
    isTablet
  } = useResponsiveLayout();
  const [imageError, setImageError] = useState(false);

  // Auto-responsive variant and size
  const variant = propVariant === 'auto' ? isMobile ? 'icon' : 'horizontal' : propVariant;
  const size = propSize === 'auto' ? isMobile ? 'sm' : isTablet ? 'md' : 'lg' : propSize;
  const iconSize = iconSizeMap[size] || 'md';
  const textSize = textSizeMap[size] || 'text-lg';

  // Handle custom organization logo (keep PNG support for custom logos)
  if (customLogoUrl && !imageError) {
    const logoAlt = `${organizationName} logo`;
    const pixelSize = {
      xs: 16,
      sm: 24,
      md: 32,
      lg: 40,
      xl: 48
    }[size] || 32;
    return <div className={cn("flex items-center", className)}>
        <LazyImage src={customLogoUrl} alt={logoAlt} width={pixelSize} height={pixelSize} priority={priority} skeleton={false} className="h-auto w-auto object-contain" onError={() => setImageError(true)} />
      </div>;
  }
  const getLogo = () => {
    // Text-only variant
    if (variant === 'text') {
      return <span className={cn("font-logo font-bold tracking-tight", textSize)}>
          <span className="text-primary">ATS</span>
          <span className="text-muted-foreground">.me</span>
        </span>;
    }

    // Icon-only variant
    if (variant === 'icon') {
      return <LogoIcon size={iconSize} />;
    }

    // Horizontal variant: icon + text
    return <div className="flex items-center gap-2">
        <LogoIcon size={iconSize} />
        <span className={cn("font-logo font-bold tracking-tight", textSize)}>
          <span className="text-primary">ᴀᴛs


        </span>
          <span className="text-muted-foreground">.ᴍᴇ</span>
        </span>
      </div>;
  };
  const brandElement = <div className={cn("flex items-center", className)}>
      {getLogo()}
    </div>;
  if (!showAsLink) {
    return brandElement;
  }
  return <Link to={linkTo} className="flex items-center hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm" aria-label={`${organizationName} - Return to ${linkTo === '/' ? 'home' : 'dashboard'}`}>
      {brandElement}
    </Link>;
};
export default Brand;