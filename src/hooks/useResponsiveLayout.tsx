/**
 * Responsive Layout Hook
 * Provides comprehensive breakpoint detection and responsive utilities
 */

import { useEffect, useState } from 'react';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface BreakpointConfig {
  xs: number;  // 0-639px
  sm: number;  // 640-767px
  md: number;  // 768-1023px
  lg: number;  // 1024-1279px
  xl: number;  // 1280-1535px
  '2xl': number; // 1536px+
}

const breakpoints: BreakpointConfig = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export function useResponsiveLayout() {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint>('md');
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setWindowSize({ width, height });

      // Determine current breakpoint
      let breakpoint: Breakpoint = 'xs';
      if (width >= breakpoints['2xl']) breakpoint = '2xl';
      else if (width >= breakpoints.xl) breakpoint = 'xl';
      else if (width >= breakpoints.lg) breakpoint = 'lg';
      else if (width >= breakpoints.md) breakpoint = 'md';
      else if (width >= breakpoints.sm) breakpoint = 'sm';

      setCurrentBreakpoint(breakpoint);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Helper functions
  const isBreakpoint = (bp: Breakpoint) => currentBreakpoint === bp;
  const isBreakpointUp = (bp: Breakpoint) => windowSize.width >= breakpoints[bp];
  const isBreakpointDown = (bp: Breakpoint) => windowSize.width < breakpoints[bp];

  const isMobile = isBreakpointDown('md');
  const isTablet = isBreakpoint('md');
  const isDesktop = isBreakpointUp('lg');
  const isMobileOrTablet = isBreakpointDown('lg');

  return {
    currentBreakpoint,
    windowSize,
    isMobile,
    isTablet,
    isDesktop,
    isMobileOrTablet,
    isBreakpoint,
    isBreakpointUp,
    isBreakpointDown,
  };
}

/**
 * Hook for responsive values
 * Returns different values based on current breakpoint
 */
export function useResponsiveValue<T>(values: Partial<Record<Breakpoint, T>>, defaultValue: T): T {
  const { currentBreakpoint, isBreakpointUp } = useResponsiveLayout();

  // Try to find the best matching breakpoint value
  const breakpointOrder: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
  
  for (const bp of breakpointOrder) {
    if (isBreakpointUp(bp) && values[bp] !== undefined) {
      return values[bp]!;
    }
  }

  return values[currentBreakpoint] ?? defaultValue;
}

/**
 * Hook for responsive columns in grid layouts
 */
export function useResponsiveColumns(mobileColumns = 1, tabletColumns = 2, desktopColumns = 3) {
  const { isMobile, isTablet, isDesktop } = useResponsiveLayout();

  if (isDesktop) return desktopColumns;
  if (isTablet) return tabletColumns;
  return mobileColumns;
}

/**
 * Hook to detect orientation
 */
export function useOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    handleOrientationChange();
    window.addEventListener('resize', handleOrientationChange);
    
    return () => window.removeEventListener('resize', handleOrientationChange);
  }, []);

  return orientation;
}
