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
  /** Enable Ken Burns zoom/pan effect on images (default: true for slideshow) */
  enableKenBurns?: boolean;
  /** Enable floating parallax orbs for depth perception (default: false) */
  enableParallaxOrbs?: boolean;
  /** Callback when active slide changes */
  onSlideChange?: (index: number) => void;
  /** Custom overlay content rendered at z-[3] above images but below text */
  overlayContent?: React.ReactNode;
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

// Ken Burns animation variants for each slide
const kenBurnsVariants = [
  'animate-ken-burns-in',
  'animate-ken-burns-left',
  'animate-ken-burns-out',
  'animate-ken-burns-right',
];

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
  enableKenBurns = true,
  enableParallaxOrbs = false,
  onSlideChange,
  overlayContent,
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
      setCurrentSlide((prev) => {
        const next = (prev + 1) % allImages.length;
        onSlideChange?.(next);
        return next;
      });
    }, slideshowInterval);
    return () => clearInterval(timer);
  }, [hasSlideshow, isInView, allImages.length, slideshowInterval, onSlideChange]);

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
      <div className="absolute inset-0 z-0 overflow-hidden">
        {isInView && allImages.map((src, index) => {
          const isActive = currentSlide === index;
          const kenBurnsClass = enableKenBurns && hasSlideshow && isActive
            ? kenBurnsVariants[index % kenBurnsVariants.length]
            : '';
          
          return (
            <img
              key={src}
              src={src}
              srcSet={index === 0 ? srcSet : undefined}
              sizes={index === 0 ? sizes : undefined}
              alt=""
              aria-hidden="true"
              loading={index === 0 && priority ? 'eager' : 'lazy'}
              decoding={index === 0 && priority ? 'sync' : 'async'}
              onLoad={index === 0 ? () => setIsLoaded(true) : undefined}
              className={cn(
                'absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out',
                isActive ? 'opacity-100' : 'opacity-0',
                index === 0 && blurPlaceholder && !isLoaded && 'opacity-0',
                kenBurnsClass,
                enableKenBurns && 'will-change-transform'
              )}
              style={{ objectPosition }}
            />
          );
        })}
        
        {/* Blur placeholder background */}
        {blurPlaceholder && !isLoaded && (
          <div 
            className="absolute inset-0 bg-muted animate-pulse"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Parallax Floating Orbs for Depth Perception */}
      {enableParallaxOrbs && (
        <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none" aria-hidden="true">
          {/* Primary orb - top right */}
          <div 
            className="absolute top-1/4 right-1/4 w-64 h-64 md:w-96 md:h-96 
              bg-primary/10 rounded-full blur-3xl 
              motion-safe:animate-float-slow" 
          />
          {/* Secondary orb - bottom left */}
          <div 
            className="absolute bottom-1/3 left-[15%] w-48 h-48 md:w-64 md:h-64 
              bg-accent/10 rounded-full blur-3xl 
              motion-safe:animate-float-slower" 
          />
          {/* Tertiary orb - center */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
              w-72 h-72 md:w-[32rem] md:h-[32rem] 
              bg-secondary/5 rounded-full blur-3xl 
              motion-safe:animate-float-slowest" 
          />
        </div>
      )}

      {/* Primary Overlay Layer */}
      <div 
        className={cn('absolute inset-0 z-[1]', overlayClassName)}
        style={overlayOpacity !== undefined ? { opacity: overlayOpacity / 100 } : undefined}
        aria-hidden="true"
      />

      {/* Secondary gradient for enhanced text readability */}
      <div 
        className="absolute inset-0 z-[2] bg-gradient-to-b from-black/10 via-transparent to-black/20 pointer-events-none"
        aria-hidden="true"
      />

      {/* Subtle vignette for depth */}
      <div 
        className="absolute inset-0 z-[2] bg-[radial-gradient(ellipse_at_center,transparent_50%,hsl(0_0%_0%/0.15)_100%)] pointer-events-none"
        aria-hidden="true"
      />

      {/* Custom overlay content */}
      {overlayContent}

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
