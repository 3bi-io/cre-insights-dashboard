import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { LazyImage } from '@/components/optimized/LazyImage';

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

const sizeMap = {
  xs: { height: 'h-4', width: 'w-auto', pixels: 16 },
  sm: { height: 'h-6', width: 'w-auto', pixels: 24 },
  md: { height: 'h-8', width: 'w-auto', pixels: 32 },
  lg: { height: 'h-10', width: 'w-auto', pixels: 40 },
  xl: { height: 'h-12', width: 'w-auto', pixels: 48 },
  auto: { height: 'h-auto', width: 'w-auto', pixels: 32 }
};

const iconSizeMap = {
  xs: { height: 'h-4', width: 'w-4', pixels: 16 },
  sm: { height: 'h-6', width: 'w-6', pixels: 24 },
  md: { height: 'h-8', width: 'w-8', pixels: 32 },
  lg: { height: 'h-10', width: 'w-10', pixels: 40 },
  xl: { height: 'h-12', width: 'w-12', pixels: 48 },
  auto: { height: 'h-auto', width: 'w-auto', pixels: 32 }
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
  const { isMobile, isTablet, isDesktop } = useResponsiveLayout();
  const [imageError, setImageError] = useState(false);

  // Auto-responsive variant and size
  const variant = propVariant === 'auto' 
    ? (isMobile ? 'icon' : 'horizontal')
    : propVariant;
    
  const size = propSize === 'auto'
    ? (isMobile ? 'sm' : isTablet ? 'md' : 'lg')
    : propSize;

  const sizeClasses = variant === 'icon' ? iconSizeMap[size] : sizeMap[size];
  const pixelSize = sizeClasses.pixels;

  // Handle custom organization logo
  if (customLogoUrl && !imageError) {
    const logoAlt = `${organizationName} logo`;
    
    return (
      <div className={cn("flex items-center", className)}>
        {priority ? (
          <picture>
            <source 
              type="image/webp" 
              srcSet={`${customLogoUrl}?format=webp&w=${pixelSize * 2} 2x, ${customLogoUrl}?format=webp&w=${pixelSize} 1x`}
            />
            <img
              src={customLogoUrl}
              alt={logoAlt}
              width={pixelSize}
              height={pixelSize}
              loading="eager"
              decoding="async"
              onError={() => setImageError(true)}
              className={cn(sizeClasses.height, sizeClasses.width, "object-contain")}
            />
          </picture>
        ) : (
          <LazyImage
            src={customLogoUrl}
            alt={logoAlt}
            width={pixelSize}
            height={pixelSize}
            priority={priority}
            skeleton={false}
            className={cn(sizeClasses.height, sizeClasses.width, "object-contain")}
            onError={() => setImageError(true)}
          />
        )}
      </div>
    );
  }
  
  const getLogo = () => {
    // Text-only fallback
    if (variant === 'text' || imageError) {
      return (
        <span className={cn(
          "font-bold text-primary",
          size === 'xs' && "text-sm",
          size === 'sm' && "text-base",
          size === 'md' && "text-lg",
          size === 'lg' && "text-xl",
          size === 'xl' && "text-2xl"
        )}>
          ATS.me
        </span>
      );
    }

    // Icon variant
    if (variant === 'icon') {
      return priority ? (
        <img 
          src="/logo-icon.png" 
          alt="ATS.me" 
          width={pixelSize}
          height={pixelSize}
          loading="eager"
          decoding="async"
          onError={() => setImageError(true)}
          className={cn(sizeClasses.height, sizeClasses.width, "object-contain")}
        />
      ) : (
        <LazyImage
          src="/logo-icon.png"
          alt="ATS.me"
          width={pixelSize}
          height={pixelSize}
          priority={priority}
          skeleton={false}
          onError={() => setImageError(true)}
          className={cn(sizeClasses.height, sizeClasses.width, "object-contain")}
        />
      );
    }

    // Horizontal logo with dark mode support
    const lightLogo = priority ? (
      <img 
        src="/logo.png"
        alt="ATS.me" 
        width={pixelSize * 3}
        height={pixelSize}
        loading="eager"
        decoding="async"
        onError={() => setImageError(true)}
        className={cn(sizeClasses.height, sizeClasses.width, "object-contain dark:hidden")}
      />
    ) : (
      <LazyImage
        src="/logo.png"
        alt="ATS.me"
        width={pixelSize * 3}
        height={pixelSize}
        priority={priority}
        skeleton={false}
        onError={() => setImageError(true)}
        className={cn(sizeClasses.height, sizeClasses.width, "object-contain dark:hidden")}
      />
    );

    const darkLogo = theme === 'auto' && (
      priority ? (
        <img 
          src="/logo-white.png"
          alt="ATS.me" 
          width={pixelSize * 3}
          height={pixelSize}
          loading="eager"
          decoding="async"
          onError={() => setImageError(true)}
          className={cn(sizeClasses.height, sizeClasses.width, "object-contain hidden dark:block")}
        />
      ) : (
        <LazyImage
          src="/logo-white.png"
          alt="ATS.me"
          width={pixelSize * 3}
          height={pixelSize}
          priority={priority}
          skeleton={false}
          onError={() => setImageError(true)}
          className={cn(sizeClasses.height, sizeClasses.width, "object-contain hidden dark:block")}
        />
      )
    );

    return (
      <>
        {lightLogo}
        {darkLogo}
      </>
    );
  };

  const brandElement = (
    <div className={cn("flex items-center", className)}>
      {getLogo()}
    </div>
  );

  if (!showAsLink) {
    return brandElement;
  }

  return (
    <Link 
      to={linkTo} 
      className="flex items-center hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
      aria-label={`${organizationName} - Return to ${linkTo === '/' ? 'home' : 'dashboard'}`}
    >
      {brandElement}
    </Link>
  );
};

export default Brand;