// Performance utilities for React optimization
import { useCallback, useMemo, useRef } from 'react';

/**
 * Debounced callback hook for preventing excessive function calls
 */
export const useDebouncedCallback = <T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  return useCallback(((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }) as T, [callback, delay]);
};

/**
 * Throttled callback hook for rate limiting function calls
 */
export const useThrottledCallback = <T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef<number>(Date.now());
  
  return useCallback(((...args: any[]) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = Date.now();
    }
  }) as T, [callback, delay]);
};

/**
 * Memoized stable sort for arrays
 */
export const useStableSort = <T>(
  array: T[] | undefined,
  compareFn?: (a: T, b: T) => number
): T[] => {
  return useMemo(() => {
    if (!array) return [];
    
    // Add stable index to maintain order for equal elements
    const indexed = array.map((item, index) => ({ item, index }));
    
    indexed.sort((a, b) => {
      const result = compareFn ? compareFn(a.item, b.item) : 0;
      return result !== 0 ? result : a.index - b.index;
    });
    
    return indexed.map(({ item }) => item);
  }, [array, compareFn]);
};

/**
 * Memoized array filter with stable results
 */
export const useStableFilter = <T>(
  array: T[] | undefined,
  predicate: (item: T, index: number) => boolean,
  deps: any[] = []
): T[] => {
  return useMemo(() => {
    if (!array) return [];
    return array.filter(predicate);
  }, [array, ...deps]);
};

/**
 * Performance observer hook for monitoring component render times
 */
export const useRenderTimeObserver = (componentName: string) => {
  const startTime = useRef<number>(performance.now());
  
  return useCallback(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;
    
    if (renderTime > 16) { // Log slow renders (>16ms)
      console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
    }
    
    startTime.current = performance.now();
  }, [componentName]);
};

/**
 * Virtual scrolling utilities
 */
export const useVirtualScrolling = (
  items: any[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) => {
  return useMemo(() => {
    const visibleItemCount = Math.ceil(containerHeight / itemHeight);
    const totalItemCount = items.length;
    
    return {
      totalItemCount,
      visibleItemCount,
      getVisibleRange: (scrollTop: number) => {
        const startIndex = Math.floor(scrollTop / itemHeight);
        const endIndex = Math.min(
          startIndex + visibleItemCount + overscan,
          totalItemCount - 1
        );
        
        return {
          startIndex: Math.max(0, startIndex - overscan),
          endIndex,
          visibleItems: items.slice(
            Math.max(0, startIndex - overscan),
            endIndex + 1
          ),
        };
      },
    };
  }, [items, itemHeight, containerHeight, overscan]);
};

/**
 * Hook for intersection observer (lazy loading)
 * Fixed to properly manage observer lifecycle and prevent memory leaks
 */
export const useIntersectionObserver = (
  callback: () => void,
  options?: IntersectionObserverInit
) => {
  const callbackRef = useRef(callback);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);
  
  callbackRef.current = callback;

  const setRef = useCallback((element: HTMLElement | null) => {
    // Disconnect previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    elementRef.current = element;

    if (element) {
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting) {
          callbackRef.current();
          observerRef.current?.disconnect();
          observerRef.current = null;
        }
      }, options);

      observerRef.current.observe(element);
    }
  }, [options]);

  return setRef;
};

/**
 * Memory usage monitor
 */
export const useMemoryMonitor = () => {
  return useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      console.log('Memory usage:', {
        used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)} MB`,
        total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)} MB`,
        limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)} MB`,
      });
    }
  }, []);
};