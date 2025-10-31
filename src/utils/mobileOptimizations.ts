/**
 * Mobile-First Optimization Utilities
 * Ensures best-in-class mobile UX with proper touch targets and responsive behavior
 */

import { useEffect, useState } from 'react';

// WCAG 2.1 AA minimum touch target size (44x44px)
export const MIN_TOUCH_TARGET = 44;

/**
 * Hook to detect device capabilities and connection quality
 */
export function useDeviceCapabilities() {
  const [capabilities, setCapabilities] = useState({
    isMobile: false,
    isTablet: false,
    isTouch: false,
    hasReducedMotion: false,
    connectionSpeed: 'fast' as 'slow' | 'medium' | 'fast',
    pixelRatio: 1,
  });

  useEffect(() => {
    const checkCapabilities = () => {
      const width = window.innerWidth;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const hasReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const pixelRatio = window.devicePixelRatio || 1;

      // Check connection quality
      let connectionSpeed: 'slow' | 'medium' | 'fast' = 'fast';
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        const effectiveType = connection?.effectiveType;
        
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
          connectionSpeed = 'slow';
        } else if (effectiveType === '3g') {
          connectionSpeed = 'medium';
        }
      }

      setCapabilities({
        isMobile,
        isTablet,
        isTouch,
        hasReducedMotion,
        connectionSpeed,
        pixelRatio,
      });
    };

    checkCapabilities();
    window.addEventListener('resize', checkCapabilities);
    
    return () => window.removeEventListener('resize', checkCapabilities);
  }, []);

  return capabilities;
}

/**
 * Hook for optimized images based on device capabilities
 */
export function useOptimizedImage(src: string, options?: {
  lowQualitySrc?: string;
  quality?: 'low' | 'medium' | 'high';
}) {
  const { connectionSpeed, pixelRatio } = useDeviceCapabilities();
  const [imageSrc, setImageSrc] = useState(options?.lowQualitySrc || src);

  useEffect(() => {
    // Load low quality first for slow connections
    if (connectionSpeed === 'slow' && options?.lowQualitySrc) {
      setImageSrc(options.lowQualitySrc);
      return;
    }

    // For high DPI screens on fast connections, use high quality
    if (pixelRatio >= 2 && connectionSpeed === 'fast') {
      setImageSrc(src);
      return;
    }

    // Default to regular quality
    setImageSrc(src);
  }, [src, connectionSpeed, pixelRatio, options?.lowQualitySrc]);

  return imageSrc;
}

/**
 * Touch-friendly click handler with tap highlighting prevention
 */
export function useTouchFriendlyClick<T extends HTMLElement>(
  callback: (event: React.MouseEvent<T> | React.TouchEvent<T>) => void,
  options?: {
    preventDoubleTap?: boolean;
    tapDelay?: number;
  }
) {
  const [lastTap, setLastTap] = useState(0);
  
  return (event: React.MouseEvent<T> | React.TouchEvent<T>) => {
    const now = Date.now();
    const delay = options?.tapDelay || 300;

    // Prevent double-tap if enabled
    if (options?.preventDoubleTap && now - lastTap < delay) {
      event.preventDefault();
      return;
    }

    setLastTap(now);
    callback(event);
  };
}

/**
 * Get responsive font size classes
 */
export function getResponsiveFontSize(baseSize: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl') {
  const sizeMap = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-base sm:text-lg',
    xl: 'text-lg sm:text-xl',
    '2xl': 'text-xl sm:text-2xl',
    '3xl': 'text-2xl sm:text-3xl',
    '4xl': 'text-3xl sm:text-4xl',
  };

  return sizeMap[baseSize] || sizeMap.base;
}

/**
 * Get responsive spacing classes
 */
export function getResponsiveSpacing(size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl') {
  const spacingMap = {
    xs: 'p-2 sm:p-3',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
    xl: 'p-8 sm:p-10',
    '2xl': 'p-10 sm:p-12',
    '3xl': 'p-12 sm:p-16',
  };

  return spacingMap[size] || spacingMap.md;
}

/**
 * Ensure minimum touch target size
 */
export function getTouchTargetClasses(minSize: number = MIN_TOUCH_TARGET) {
  return `min-h-[${minSize}px] min-w-[${minSize}px] touch-manipulation`;
}

/**
 * Get optimized animation classes based on device capabilities
 */
export function useOptimizedAnimations() {
  const { hasReducedMotion } = useDeviceCapabilities();

  return {
    fadeIn: hasReducedMotion ? '' : 'animate-fade-in',
    slideIn: hasReducedMotion ? '' : 'animate-slide-in-right',
    scaleIn: hasReducedMotion ? '' : 'animate-scale-in',
    transition: hasReducedMotion ? '' : 'transition-all duration-200',
  };
}

/**
 * Viewport-based lazy loading helper
 */
export function useInViewport(
  ref: React.RefObject<HTMLElement>,
  options?: IntersectionObserverInit
) {
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [ref, options]);

  return isInView;
}

/**
 * Responsive container classes
 */
export function getResponsiveContainer(variant: 'narrow' | 'default' | 'wide' | 'fluid' = 'default') {
  const containerMap = {
    narrow: 'max-w-2xl mx-auto px-4 sm:px-6',
    default: 'container mx-auto px-4 sm:px-6 lg:px-8',
    wide: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    fluid: 'w-full px-4 sm:px-6 lg:px-8',
  };

  return containerMap[variant];
}

/**
 * Safe area insets for devices with notches
 */
export function getSafeAreaClasses() {
  return 'pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]';
}
