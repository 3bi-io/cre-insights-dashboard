// Utility functions for cleaning up console.log statements in production

import { logger } from '@/services/loggerService';

// Replace console.log with proper logging
export const logInfo = (message: string, data?: unknown, context?: string) => {
  logger.info(message, data, context);
};

export const logError = (message: string, error?: unknown, context?: string) => {
  logger.error(message, error, context);
};

export const logWarn = (message: string, data?: unknown, context?: string) => {
  logger.warn(message, data, context);
};

export const logDebug = (message: string, data?: unknown, context?: string) => {
  logger.debug(message, data, context);
};

// Performance logging utilities
export const logPerformance = (operationName: string, startTime: number, context?: string) => {
  const duration = performance.now() - startTime;
  logger.debug(`${operationName} completed in ${duration.toFixed(2)}ms`, { duration }, context || 'Performance');
};

export const withPerformanceLogging = <T extends (...args: any[]) => any>(
  fn: T,
  operationName: string,
  context?: string
): T => {
  return ((...args: Parameters<T>) => {
    const startTime = performance.now();
    const result = fn(...args);
    
    if (result instanceof Promise) {
      return result.finally(() => {
        logPerformance(operationName, startTime, context);
      });
    } else {
      logPerformance(operationName, startTime, context);
      return result;
    }
  }) as T;
};

// API logging utilities
export const logApiRequest = (method: string, url: string, data?: unknown) => {
  logger.debug(`API Request: ${method} ${url}`, { method, url, data }, 'API');
};

export const logApiResponse = (method: string, url: string, status: number, data?: unknown) => {
  const level = status >= 400 ? 'error' : 'debug';
  logger[level](`API Response: ${method} ${url} - ${status}`, { method, url, status, data }, 'API');
};

export const logApiError = (method: string, url: string, error: unknown) => {
  logger.error(`API Error: ${method} ${url}`, error, 'API');
};

// Component lifecycle logging
export const logComponentMount = (componentName: string, props?: unknown) => {
  logger.debug(`Component mounted: ${componentName}`, props, 'Component');
};

export const logComponentUnmount = (componentName: string) => {
  logger.debug(`Component unmounted: ${componentName}`, undefined, 'Component');
};

export const logComponentUpdate = (componentName: string, changedProps?: string[]) => {
  logger.debug(`Component updated: ${componentName}`, { changedProps }, 'Component');
};