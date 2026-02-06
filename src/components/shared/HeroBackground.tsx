/**
 * HeroBackground Component
 * Reusable hero section with responsive background images, overlay gradients, and lazy loading
 * Ensures WCAG contrast for overlaid text with multiple overlay options
 */

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface ResponsiveImage {
  src: string;
  width: number;
}

export interface HeroBackgroundProps {
  /** Primary image source */
  imageSrc: string;
  /** Alt text for accessibility (used for screen readers even if aria-hidden) */
  imageAlt: string;
  /** Optional responsive image sources for srcset */
  responsiveImages?: ResponsiveImage[];
  /** Size variant - 'full' for landing pages, 'compact' for listing pages */
  variant?: 'full' | 'compact';
  /** Overlay style variant */
  overlayVariant?: 'dark' | 'gradient' | 'light' | 'radial' | 'vignette';
  /** Custom overlay opacity (0-100) */
  overlayOpacity?: number;
  /** Enable lazy loading (default: true for below-fold, false for hero) */
  lazyLoad?: boolean;
  /** Image loading priority - eager for above-fold heroes */
  priority?: boolean;
  /** Blur placeholder while loading */
  blurPlaceholder?: boolean;
  /** Object position for responsive cropping */
  objectPosition?: string;
  children: React.ReactNode;
  className?: string;
}

const overlayStyles = {
  dark: 'bg-background/70',
  gradient: 'bg-gradient-to-t from-background via-background/60 to-transparent',
  light: 'bg-background/40',
  radial: 'bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background)/0.8)_100%)]',
  vignette: 'bg-[radial-gradient(ellipse_at_center,transparent_30%,hsl(var(--background)/0.9)_100%)]',
} as const;

const variantStyles = {
  full: 'min-h-[90vh] md:min-h-screen flex items-center justify-center',
  compact: 'py-12 md:py-20',
} as const;

export const HeroBackground: React.FC<HeroBackgroundProps> = ({
  imageSrc,
  imageAlt,
  responsiveImages,
  variant,
  overlayVariant = 'dark',
  overlayOpacity,
  lazyLoad = false,
  priority = true,
  blurPlaceholder = true,
  objectPosition = 'center',
  children,
  className,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(!lazyLoad);
  const containerRef = useRef<HTMLElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazyLoad || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // Preload 200px before visible
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [lazyLoad, isInView]);

  // Generate srcset from responsive images
  const srcSet = responsiveImages?.length
    ? responsiveImages.map(img => `${img.src} ${img.width}w`).join(', ')
    : undefined;

  // Generate sizes attribute for responsive loading
  const sizes = responsiveImages?.length
    ? '(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 100vw'
    : undefined;

  // Custom opacity style
  const customOpacity = overlayOpacity !== undefined 
    ? { '--hero-overlay-opacity': overlayOpacity / 100 } as React.CSSProperties
    : undefined;

  const overlayClassName = overlayOpacity !== undefined
    ? 'bg-background'
    : overlayStyles[overlayVariant];

  // Combine variant styles with custom className
  const combinedClassName = cn(
    'relative overflow-hidden',
    variant && variantStyles[variant],
    className
  );

  return (
    <section 
      ref={containerRef}
      className={combinedClassName}
    >
      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0">
        {isInView && (
          <img
            src={imageSrc}
            srcSet={srcSet}
            sizes={sizes}
            alt=""
            aria-hidden="true"
            loading={priority ? 'eager' : 'lazy'}
            decoding={priority ? 'sync' : 'async'}
            fetchPriority={priority ? 'high' : 'auto'}
            onLoad={() => setIsLoaded(true)}
            className={cn(
              'w-full h-full object-cover transition-opacity duration-500',
              blurPlaceholder && !isLoaded && 'opacity-0',
              isLoaded && 'opacity-100'
            )}
            style={{ objectPosition }}
          />
        )}
        
        {/* Blur placeholder background */}
        {blurPlaceholder && !isLoaded && (
          <div 
            className="absolute inset-0 bg-muted animate-pulse"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Primary Overlay Layer */}
      <div 
        className={cn('absolute inset-0 z-[1]', overlayClassName)}
        style={overlayOpacity !== undefined ? { opacity: overlayOpacity / 100 } : undefined}
        aria-hidden="true"
      />

      {/* Secondary gradient for enhanced text readability */}
      <div 
        className="absolute inset-0 z-[2] bg-gradient-to-b from-background/20 via-transparent to-background/40 pointer-events-none"
        aria-hidden="true"
      />

      {/* Subtle vignette for depth */}
      <div 
        className="absolute inset-0 z-[2] bg-[radial-gradient(ellipse_at_center,transparent_50%,hsl(var(--background)/0.3)_100%)] pointer-events-none"
        aria-hidden="true"
      />

      {/* Content Layer */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Screen reader description */}
      <span className="sr-only">{imageAlt}</span>
    </section>
  );
};

export default HeroBackground;
