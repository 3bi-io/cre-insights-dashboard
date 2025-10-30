/**
 * Development Tools & Utilities
 * Provides debugging helpers, performance monitoring, and development-only features
 */

import React from 'react';
import { logger } from '@/lib/logger';

export interface DevToolsConfig {
  enabled: boolean;
  showPerformanceMetrics: boolean;
  showErrorBoundary: boolean;
  enableVerboseLogging: boolean;
  showNetworkRequests: boolean;
}

class DevTools {
  private config: DevToolsConfig;
  private performanceMarks = new Map<string, number>();
  private isDevMode = import.meta.env.DEV;

  constructor() {
    this.config = {
      enabled: this.isDevMode,
      showPerformanceMetrics: this.isDevMode,
      showErrorBoundary: true,
      enableVerboseLogging: this.isDevMode,
      showNetworkRequests: this.isDevMode
    };

    if (this.config.enabled) {
      this.initializeDevTools();
    }
  }

  private initializeDevTools() {
    // Add global devTools to window for debugging
    (window as any).devTools = {
      logger,
      performance: this.getPerformanceUtils(),
      config: this.config,
      debug: this.getDebugUtils(),
      inspect: this.getInspectionUtils()
    };

    logger.info('DevTools initialized', { config: this.config });
  }

  /**
   * Performance monitoring utilities
   */
  getPerformanceUtils() {
    return {
      mark: (name: string) => {
        this.performanceMarks.set(name, performance.now());
      },
      
      measure: (name: string, startMark?: string) => {
        const endTime = performance.now();
        const startTime = startMark ? 
          this.performanceMarks.get(startMark) || 0 : 
          this.performanceMarks.get(name) || 0;
        
        const duration = endTime - startTime;
        
        if (this.config.showPerformanceMetrics) {
          logger.info(`Performance: ${name}`, { 
            duration: `${duration.toFixed(2)}ms`,
            startTime,
            endTime 
          });
        }
        
        return duration;
      },

      getMemoryUsage: () => {
        if ('memory' in performance) {
          return (performance as any).memory;
        }
        return null;
      },

      profileComponent: (componentName: string, fn: () => void) => {
        this.performanceMarks.set(`${componentName}-start`, performance.now());
        fn();
        const duration = performance.now() - this.performanceMarks.get(`${componentName}-start`)!;
        
        if (duration > 16) { // Highlight slow renders (> 1 frame)
          logger.warn(`Slow component render: ${componentName}`, { 
            duration: `${duration.toFixed(2)}ms` 
          });
        }
        
        return duration;
      }
    };
  }

  /**
   * Debug utilities for development
   */
  getDebugUtils() {
    return {
      logComponentProps: (componentName: string, props: any) => {
        if (this.config.enableVerboseLogging) {
          logger.debug(`${componentName} props`, props);
        }
      },

      logStateChange: (componentName: string, prevState: any, newState: any) => {
        if (this.config.enableVerboseLogging) {
          logger.debug(`${componentName} state change`, { 
            from: prevState, 
            to: newState 
          });
        }
      },

      logApiCall: (method: string, url: string, data?: any) => {
        if (this.config.showNetworkRequests) {
          logger.info(`API ${method.toUpperCase()}`, { url, data });
        }
      },

      inspectElement: (element: HTMLElement | null) => {
        if (element) {
          console.log('Element inspection:', {
            tagName: element.tagName,
            className: element.className,
            id: element.id,
            attributes: Array.from(element.attributes).reduce((acc, attr) => {
              acc[attr.name] = attr.value;
              return acc;
            }, {} as Record<string, string>),
            boundingRect: element.getBoundingClientRect(),
            computedStyle: window.getComputedStyle(element)
          });
        }
      }
    };
  }

  /**
   * Code inspection and analysis utilities
   */
  getInspectionUtils() {
    return {
      analyzeBundle: () => {
        if ('getEntriesByType' in performance) {
          const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
          const analysis = {
            totalResources: resources.length,
            jsFiles: resources.filter(r => r.name.includes('.js')).length,
            cssFiles: resources.filter(r => r.name.includes('.css')).length,
            images: resources.filter(r => /\.(png|jpg|jpeg|gif|svg|webp)/.test(r.name)).length,
            largeResources: resources.filter(r => r.transferSize > 100000), // > 100KB
            slowResources: resources.filter(r => r.duration > 1000) // > 1s
          };
          
          logger.info('Bundle Analysis', analysis);
          return analysis;
        }
        return null;
      },

      checkAccessibility: (element?: HTMLElement) => {
        const root = element || document.body;
        const issues: string[] = [];

        // Check for images without alt text
        const images = root.querySelectorAll('img:not([alt])');
        if (images.length > 0) {
          issues.push(`${images.length} images missing alt text`);
        }

        // Check for buttons without accessible names
        const buttons = root.querySelectorAll('button:not([aria-label]):not([title])');
        buttons.forEach(button => {
          if (!button.textContent?.trim()) {
            issues.push('Button without accessible name found');
          }
        });

        // Check for form inputs without labels
        const inputs = root.querySelectorAll('input:not([aria-label]):not([title])');
        inputs.forEach(input => {
          const id = input.getAttribute('id');
          if (!id || !root.querySelector(`label[for="${id}"]`)) {
            issues.push('Input without associated label found');
          }
        });

        if (issues.length > 0) {
          logger.warn('Accessibility issues found', { issues });
        } else {
          logger.info('No accessibility issues detected');
        }

        return issues;
      }
    };
  }

  /**
   * Component performance wrapper
   */
  wrapComponent<T extends (...args: any[]) => any>(
    componentName: string, 
    component: T
  ): T {
    if (!this.config.enabled) return component;

    return ((...args: Parameters<T>) => {
      const startTime = performance.now();
      const result = component(...args);
      const endTime = performance.now();
      
      if (endTime - startTime > 16) {
        logger.warn(`Slow component: ${componentName}`, { 
          renderTime: `${(endTime - startTime).toFixed(2)}ms` 
        });
      }
      
      return result;
    }) as T;
  }

  /**
   * Error boundary enhancement
   */
  enhanceError(error: Error, componentStack?: string) {
    const enhancedError = {
      ...error,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      componentStack,
      memoryUsage: this.getPerformanceUtils().getMemoryUsage()
    };

    logger.error('Enhanced error report', enhancedError);
    return enhancedError;
  }

  /**
   * Update dev tools configuration
   */
  updateConfig(newConfig: Partial<DevToolsConfig>) {
    this.config = { ...this.config, ...newConfig };
    logger.info('DevTools config updated', { config: this.config });
  }

  /**
   * Get current configuration
   */
  getConfig(): DevToolsConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const devTools = new DevTools();

/**
 * React component wrapper for performance monitoring
 */
export function withPerformanceMonitoring<P extends Record<string, any>>(
  componentName: string,
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return (props: P) => {
    const startTime = performance.now();
    
    React.useEffect(() => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (renderTime > 16 && devTools.getConfig().showPerformanceMetrics) {
        logger.warn(`Component ${componentName} slow render`, { 
          renderTime: `${renderTime.toFixed(2)}ms` 
        });
      }
    });

    return React.createElement(Component, props);
  };
}

/**
 * Hook for debugging component lifecycle
 */
export function useComponentDebug(componentName: string, props?: any, state?: any) {
  React.useEffect(() => {
    devTools.getDebugUtils().logComponentProps(componentName, props);
  }, [componentName, props]);

  React.useEffect(() => {
    if (state) {
      devTools.getDebugUtils().logStateChange(componentName, undefined, state);
    }
  }, [componentName, state]);
}

// Type exports for external use
export interface DevToolsConfig {
  enabled: boolean;
  showPerformanceMetrics: boolean;
  showErrorBoundary: boolean;
  enableVerboseLogging: boolean;
  showNetworkRequests: boolean;
}