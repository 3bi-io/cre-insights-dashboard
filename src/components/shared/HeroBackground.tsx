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
  /** Optional additional images for slideshow rotation */
  slideshowImages?: string[];
  /** Slideshow interval in milliseconds (default: 6000) */
  slideshowInterval?: number;
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
  slideshowImages,
  slideshowInterval = 6000,
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
  const [currentSlide, setCurrentSlide] = useState(0);
  const containerRef = useRef<HTMLElement>(null);

  // Combine all images for slideshow
  const allImages = slideshowImages?.length 
    ? [imageSrc, ...slideshowImages] 
    : [imageSrc];
  const hasSlideshow = allImages.length > 1;

  // Slideshow auto-rotation
  useEffect(() => {
    if (!hasSlideshow || !isInView) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % allImages.length);
    }, slideshowInterval);
    return () => clearInterval(timer);
  }, [hasSlideshow, isInView, allImages.length, slideshowInterval]);

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
        {isInView && allImages.map((src, index) => (
          <img
            key={src}
            src={src}
            srcSet={index === 0 ? srcSet : undefined}
            sizes={index === 0 ? sizes : undefined}
            alt=""
            aria-hidden="true"
            loading={index === 0 && priority ? 'eager' : 'lazy'}
            decoding={index === 0 && priority ? 'sync' : 'async'}
            fetchPriority={index === 0 && priority ? 'high' : 'auto'}
            onLoad={index === 0 ? () => setIsLoaded(true) : undefined}
            className={cn(
              'absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out',
              currentSlide === index ? 'opacity-100' : 'opacity-0',
              index === 0 && blurPlaceholder && !isLoaded && 'opacity-0'
            )}
            style={{ objectPosition }}
          />
        ))}
        
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
