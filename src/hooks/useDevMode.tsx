/**
 * Development Mode Hook
 * Provides development-specific utilities and debugging capabilities
 */

import { useState, useEffect, useCallback } from 'react';
import { devTools } from '@/utils/devTools';
import { logger } from '@/services/loggerService';

interface DevModeState {
  isDevMode: boolean;
  showDebugPanel: boolean;
  performanceMetrics: {
    renderCount: number;
    lastRenderTime: number;
    averageRenderTime: number;
    totalRenderTime: number;
  };
  debugInfo: Record<string, any>;
}

export function useDevMode(componentName?: string) {
  const [devState, setDevState] = useState<DevModeState>({
    isDevMode: import.meta.env.DEV,
    showDebugPanel: false,
    performanceMetrics: {
      renderCount: 0,
      lastRenderTime: 0,
      averageRenderTime: 0,
      totalRenderTime: 0
    },
    debugInfo: {}
  });

  // Performance tracking for component renders
  const trackRender = useCallback(() => {
    if (!devState.isDevMode || !componentName) return;

    const startTime = performance.now();
    
    return () => {
      const renderTime = performance.now() - startTime;
      
      setDevState(prev => {
        const newRenderCount = prev.performanceMetrics.renderCount + 1;
        const newTotalTime = prev.performanceMetrics.totalRenderTime + renderTime;
        
        return {
          ...prev,
          performanceMetrics: {
            renderCount: newRenderCount,
            lastRenderTime: renderTime,
            averageRenderTime: newTotalTime / newRenderCount,
            totalRenderTime: newTotalTime
          }
        };
      });

      // Log slow renders
      if (renderTime > 16) {
        logger.warn(`Slow render detected: ${componentName}`, {
          renderTime: `${renderTime.toFixed(2)}ms`,
          renderCount: devState.performanceMetrics.renderCount + 1
        });
      }
    };
  }, [devState.isDevMode, componentName, devState.performanceMetrics.renderCount]);

  // Debug info management
  const setDebugInfo = useCallback((key: string, value: any) => {
    if (!devState.isDevMode) return;
    
    setDevState(prev => ({
      ...prev,
      debugInfo: {
        ...prev.debugInfo,
        [key]: value
      }
    }));
  }, [devState.isDevMode]);

  const logComponentEvent = useCallback((event: string, data?: any) => {
    if (!devState.isDevMode || !componentName) return;
    
    logger.debug(`${componentName}: ${event}`, data);
  }, [devState.isDevMode, componentName]);

  // Props inspection
  const inspectProps = useCallback((props: any) => {
    if (!devState.isDevMode) return;
    
    const propsAnalysis = {
      propCount: Object.keys(props).length,
      propTypes: Object.entries(props).reduce((acc, [key, value]) => {
        acc[key] = typeof value;
        return acc;
      }, {} as Record<string, string>),
      complexProps: Object.entries(props).filter(([, value]) => 
        typeof value === 'object' && value !== null
      ).map(([key]) => key)
    };

    setDebugInfo('props', propsAnalysis);
    
    if (componentName) {
      devTools.getDebugUtils().logComponentProps(componentName, propsAnalysis);
    }
  }, [devState.isDevMode, componentName, setDebugInfo]);

  // State inspection
  const inspectState = useCallback((state: any, stateName = 'state') => {
    if (!devState.isDevMode) return;
    
    const stateAnalysis = {
      stateSize: JSON.stringify(state).length,
      stateType: typeof state,
      isArray: Array.isArray(state),
      keys: typeof state === 'object' && state !== null ? Object.keys(state) : []
    };

    setDebugInfo(stateName, stateAnalysis);
  }, [devState.isDevMode, setDebugInfo]);

  // Effect tracking
  const trackEffect = useCallback((effectName: string, dependencies: any[]) => {
    if (!devState.isDevMode) return;
    
    const depAnalysis = {
      dependencyCount: dependencies.length,
      dependencies: dependencies.map(dep => ({
        type: typeof dep,
        value: dep,
        isStable: typeof dep !== 'object' || dep === null
      }))
    };

    logComponentEvent(`Effect: ${effectName}`, depAnalysis);
  }, [devState.isDevMode, logComponentEvent]);

  // Memory usage tracking
  const trackMemoryUsage = useCallback(() => {
    if (!devState.isDevMode || !('memory' in performance)) return null;
    
    const memory = (performance as any).memory;
    const memoryInfo = {
      used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
      allocated: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`,
      limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`,
      usage: `${Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)}%`
    };
    
    setDebugInfo('memory', memoryInfo);
    return memoryInfo;
  }, [devState.isDevMode, setDebugInfo]);

  // Hot reload detection
  useEffect(() => {
    if (!devState.isDevMode) return;
    
    const handleHotReload = () => {
      logger.info('Hot reload detected', { component: componentName });
    };

    // Listen for Vite HMR events
    if (import.meta.hot) {
      import.meta.hot.on('vite:beforeUpdate', handleHotReload);
      
      return () => {
        import.meta.hot?.off('vite:beforeUpdate', handleHotReload);
      };
    }
  }, [devState.isDevMode, componentName]);

  // Development utilities
  const devUtils = {
    trackRender,
    setDebugInfo,
    logComponentEvent,
    inspectProps,
    inspectState,
    trackEffect,
    trackMemoryUsage,
    
    // Convenience methods
    measureAsync: async <T,>(name: string, fn: () => Promise<T>): Promise<T> => {
      if (!devState.isDevMode) return fn();
      
      const start = performance.now();
      try {
        const result = await fn();
        const duration = performance.now() - start;
        logger.info(`Async operation: ${name}`, { duration: `${duration.toFixed(2)}ms` });
        return result;
      } catch (error) {
        const duration = performance.now() - start;
        logger.error(`Async operation failed: ${name}`, { 
          duration: `${duration.toFixed(2)}ms`, 
          error 
        });
        throw error;
      }
    },

    benchmark: (name: string, fn: () => any, iterations = 1000) => {
      if (!devState.isDevMode) return fn();
      
      const results: number[] = [];
      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        fn();
        results.push(performance.now() - start);
      }
      
      const avg = results.reduce((a, b) => a + b, 0) / results.length;
      const min = Math.min(...results);
      const max = Math.max(...results);
      
      logger.info(`Benchmark: ${name}`, {
        iterations,
        average: `${avg.toFixed(2)}ms`,
        min: `${min.toFixed(2)}ms`,
        max: `${max.toFixed(2)}ms`
      });
      
      return { average: avg, min, max, results };
    },

    toggleDebugPanel: () => {
      setDevState(prev => ({
        ...prev,
        showDebugPanel: !prev.showDebugPanel
      }));
    }
  };

  return {
    ...devState,
    ...devUtils
  };
}

/**
 * Hook for debugging React component lifecycle
 */
export function useComponentLifecycle(componentName: string) {
  const devMode = useDevMode(componentName);
  
  useEffect(() => {
    devMode.logComponentEvent('mounted');
    
    return () => {
      devMode.logComponentEvent('unmounted');
    };
  }, []);

  useEffect(() => {
    devMode.logComponentEvent('updated');
  });

  return devMode;
}

/**
 * Hook for debugging React hooks
 */
export function useHookDebugger<T>(hookName: string, value: T, dependencies?: any[]): T {
  const devMode = useDevMode();
  
  useEffect(() => {
    if (devMode.isDevMode) {
      devMode.logComponentEvent(`Hook: ${hookName}`, {
        value,
        dependencies,
        timestamp: new Date().toISOString()
      });
    }
  }, [hookName, value, dependencies, devMode]);
  
  return value;
}