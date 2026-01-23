/**
 * Map Context Provider
 * Shares responsive state and map configuration across components
 */

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useOrientation } from '@/hooks/useResponsiveLayout';
import { IS_TOUCH_DEVICE } from './constants';

interface MapContextValue {
  // Responsive flags
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isMobileOrTablet: boolean;
  
  // Touch detection
  isTouchDevice: boolean;
  
  // Orientation
  orientation: 'portrait' | 'landscape';
  
  // Layout helpers
  isTabletLandscape: boolean;
  shouldShowSplitView: boolean;
}

const MapContext = createContext<MapContextValue | null>(null);

interface MapProviderProps {
  children: ReactNode;
}

export function MapProvider({ children }: MapProviderProps) {
  const { isMobile, isTablet, isDesktop, isMobileOrTablet } = useResponsiveLayout();
  const orientation = useOrientation();
  
  const value = useMemo<MapContextValue>(() => ({
    isMobile,
    isTablet,
    isDesktop,
    isMobileOrTablet,
    isTouchDevice: IS_TOUCH_DEVICE,
    orientation,
    isTabletLandscape: isTablet && orientation === 'landscape',
    // Show split view on tablet landscape or desktop
    shouldShowSplitView: (isTablet && orientation === 'landscape') || isDesktop,
  }), [isMobile, isTablet, isDesktop, isMobileOrTablet, orientation]);

  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  );
}

export function useMapContext(): MapContextValue {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapContext must be used within a MapProvider');
  }
  return context;
}

// Optional hook that doesn't throw - for use outside provider
export function useMapContextOptional(): MapContextValue | null {
  return useContext(MapContext);
}
