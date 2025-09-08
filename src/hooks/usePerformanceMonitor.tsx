import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface PerformanceMetrics {
  renderTime: number;
  componentCount: number;
  memoryUsage?: {
    used: number;
    total: number;
    limit: number;
  };
  bundleSize?: number;
  cacheHitRate?: number;
}

export const usePerformanceMonitor = (componentName: string) => {
  const location = useLocation();
  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);

  // Track render start
  useEffect(() => {
    renderStartTime.current = performance.now();
    renderCount.current++;
  });

  // Track render end and log metrics
  useEffect(() => {
    const renderEndTime = performance.now();
    const renderTime = renderEndTime - renderStartTime.current;

    // Log slow renders (>16ms for 60fps)
    if (renderTime > 16) {
      console.warn(`[Performance] Slow render in ${componentName}:`, {
        renderTime: `${renderTime.toFixed(2)}ms`,
        renderCount: renderCount.current,
        route: location.pathname,
      });
    }

    // Performance entry for user timing
    if (performance.mark && performance.measure) {
      const markName = `${componentName}-render-${renderCount.current}`;
      performance.mark(markName);
      
      if (renderCount.current > 1) {
        const prevMarkName = `${componentName}-render-${renderCount.current - 1}`;
        try {
          performance.measure(
            `${componentName}-render-duration`,
            prevMarkName,
            markName
          );
        } catch (error) {
          // Previous mark might not exist
        }
      }
    }
  });

  // Memory usage monitoring
  const getMemoryUsage = useCallback((): PerformanceMetrics['memoryUsage'] => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024), // MB
      };
    }
    return undefined;
  }, []);

  // Bundle size estimation
  const getBundleSize = useCallback((): number | undefined => {
    if (performance.getEntriesByType) {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const jsResources = resources.filter(resource => 
        resource.name.includes('.js') && !resource.name.includes('chunk')
      );
      
      return jsResources.reduce((total, resource) => {
        return total + (resource.transferSize || 0);
      }, 0);
    }
    return undefined;
  }, []);

  // Navigation timing
  const getNavigationMetrics = useCallback(() => {
    if (performance.getEntriesByType) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: navigation.responseStart - navigation.requestStart,
          ttfb: navigation.responseStart - navigation.fetchStart, // Time to First Byte
        };
      }
    }
    return null;
  }, []);

  // Comprehensive metrics collection
  const collectMetrics = useCallback((): PerformanceMetrics => {
    const renderTime = performance.now() - renderStartTime.current;
    
    return {
      renderTime,
      componentCount: renderCount.current,
      memoryUsage: getMemoryUsage(),
      bundleSize: getBundleSize(),
    };
  }, [getMemoryUsage, getBundleSize]);

  // Performance observer for monitoring specific metrics
  useEffect(() => {
    if (!PerformanceObserver) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry) => {
        if (entry.entryType === 'measure' && entry.name.includes(componentName)) {
          console.log(`[Performance] ${entry.name}: ${entry.duration.toFixed(2)}ms`);
        }
        
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          console.log('[Performance] Navigation timing:', {
            domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
            loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
          });
        }
        
        if (entry.entryType === 'paint') {
          console.log(`[Performance] ${entry.name}: ${entry.startTime.toFixed(2)}ms`);
        }
      });
    });

    // Observe different entry types
    try {
      observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
    } catch (error) {
      // Some entry types might not be supported
      try {
        observer.observe({ entryTypes: ['measure'] });
      } catch (fallbackError) {
        console.warn('[Performance] PerformanceObserver not fully supported');
      }
    }

    return () => {
      observer.disconnect();
    };
  }, [componentName]);

  // Route change performance tracking
  useEffect(() => {
    const routeChangeTime = performance.now();
    console.log(`[Performance] Route change to ${location.pathname} at ${routeChangeTime.toFixed(2)}ms`);
  }, [location.pathname]);

  return {
    collectMetrics,
    getNavigationMetrics,
    getMemoryUsage,
    getBundleSize,
    renderCount: renderCount.current,
  };
};

// Global performance monitoring utility
export const startPerformanceMonitoring = () => {
  // Monitor long tasks
  if (PerformanceObserver && 'longTask' in PerformanceObserver.supportedEntryTypes) {
    const longTaskObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        console.warn(`[Performance] Long task detected: ${entry.duration.toFixed(2)}ms`);
      });
    });
    
    longTaskObserver.observe({ entryTypes: ['longtask'] });
  }

  // Monitor layout shifts
  if (PerformanceObserver && 'layout-shift' in PerformanceObserver.supportedEntryTypes) {
    let cumulativeLayoutShift = 0;
    
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (!(entry as any).hadRecentInput) {
          cumulativeLayoutShift += (entry as any).value;
        }
      });
      
      // Log if CLS gets too high
      if (cumulativeLayoutShift > 0.1) {
        console.warn(`[Performance] High Cumulative Layout Shift: ${cumulativeLayoutShift.toFixed(3)}`);
      }
    });
    
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  }

  // Monitor first input delay
  if (PerformanceObserver && 'first-input' in PerformanceObserver.supportedEntryTypes) {
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const fidEntry = entry as any; // Cast to access processingStart
        if (fidEntry.processingStart && fidEntry.startTime) {
          const firstInputDelay = fidEntry.processingStart - fidEntry.startTime;
          console.log(`[Performance] First Input Delay: ${firstInputDelay.toFixed(2)}ms`);
          
          if (firstInputDelay > 100) {
            console.warn(`[Performance] High First Input Delay detected`);
          }
        }
      });
    });
    
    fidObserver.observe({ entryTypes: ['first-input'] });
  }
};

export default usePerformanceMonitor;