/**
 * Logger Utility Functions
 * 
 * Provides backward-compatible wrappers for the new logger system.
 * These handle the transition from old 3-argument calls to new 2-argument calls.
 */

import { logger } from '@/lib/logger';

type LogContext = Record<string, any>;

/**
 * Log informational messages
 * Backward compatible with old (message, data, context) signature
 */
export const logInfo = (message: string, dataOrContext?: any, legacyContext?: string) => {
  if (typeof dataOrContext === 'string' || legacyContext) {
    // Old 3-argument call: logInfo(message, data, 'Context')
    // Convert to new format
    logger.info(legacyContext ? `[${legacyContext}] ${message}` : message, 
      typeof dataOrContext === 'object' ? dataOrContext : undefined
    );
  } else {
    // New 2-argument call: logInfo(message, { context: 'value' })
    logger.info(message, dataOrContext);
  }
};

/**
 * Log error messages
 * Backward compatible with old (message, error, context) signature
 */
export const logError = (message: string, errorOrContext?: any, legacyContext?: string) => {
  if (typeof legacyContext === 'string') {
    // Old 3-argument call: logError(message, error, 'Context')
    logger.error(`[${legacyContext}] ${message}`, errorOrContext);
  } else if (errorOrContext instanceof Error || typeof errorOrContext === 'string') {
    // Error object passed
    logger.error(message, errorOrContext, typeof legacyContext === 'object' ? legacyContext : undefined);
  } else {
    // New format: logError(message, error, { context })
    logger.error(message, errorOrContext);
  }
};

/**
 * Log warning messages
 * Backward compatible with old (message, data, context) signature
 */
export const logWarn = (message: string, dataOrContext?: any, legacyContext?: string) => {
  if (typeof dataOrContext === 'string' || legacyContext) {
    logger.warn(legacyContext ? `[${legacyContext}] ${message}` : message, 
      typeof dataOrContext === 'object' ? dataOrContext : undefined
    );
  } else {
    logger.warn(message, dataOrContext);
  }
};

/**
 * Log debug messages  
 * Backward compatible with old (message, data, context) signature
 */
export const logDebug = (message: string, dataOrContext?: any, legacyContext?: string) => {
  if (typeof dataOrContext === 'string' || legacyContext) {
    logger.debug(legacyContext ? `[${legacyContext}] ${message}` : message, 
      typeof dataOrContext === 'object' ? dataOrContext : undefined
    );
  } else {
    logger.debug(message, dataOrContext);
  }
};

/**
 * Performance logging utilities
 */
export const logPerformance = (operationName: string, startTime: number, contextOrLegacy?: any) => {
  const duration = performance.now() - startTime;
  const context = typeof contextOrLegacy === 'string' 
    ? { operation: operationName, duration, context: contextOrLegacy }
    : { operation: operationName, duration, ...contextOrLegacy };
  logger.debug(`${operationName} completed in ${duration.toFixed(2)}ms`, context);
};

export const withPerformanceLogging = <T extends (...args: any[]) => any>(
  fn: T,
  operationName: string,
  context?: string | LogContext
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

/**
 * API logging utilities
 */
export const logApiRequest = (method: string, url: string, data?: unknown, contextOrLegacy?: any) => {
  const context = typeof contextOrLegacy === 'string'
    ? { method, url, data, context: contextOrLegacy }
    : { method, url, data, ...contextOrLegacy };
  logger.debug(`API Request: ${method} ${url}`, context);
};

export const logApiResponse = (method: string, url: string, status: number, data?: unknown, contextOrLegacy?: any) => {
  const context = typeof contextOrLegacy === 'string'
    ? { method, url, status, data, context: contextOrLegacy }
    : { method, url, status, data, ...contextOrLegacy };
  const level = status >= 400 ? 'error' : 'debug';
  logger[level](`API Response: ${method} ${url} - ${status}`, context);
};

export const logApiError = (method: string, url: string, error: unknown, contextOrLegacy?: any) => {
  const context = typeof contextOrLegacy === 'string'
    ? { method, url, context: contextOrLegacy }
    : { method, url, ...contextOrLegacy };
  logger.error(`API Error: ${method} ${url}`, error, context);
};

/**
 * Component lifecycle logging
 */
export const logComponentMount = (componentName: string, props?: unknown, contextOrLegacy?: any) => {
  const context = typeof contextOrLegacy === 'string'
    ? { component: componentName, props, context: contextOrLegacy }
    : { component: componentName, props, ...contextOrLegacy };
  logger.debug(`Component mounted: ${componentName}`, context);
};

export const logComponentUnmount = (componentName: string, contextOrLegacy?: any) => {
  const context = typeof contextOrLegacy === 'string'
    ? { component: componentName, context: contextOrLegacy }
    : { component: componentName, ...contextOrLegacy };
  logger.debug(`Component unmounted: ${componentName}`, context);
};

export const logComponentUpdate = (componentName: string, changedProps?: string[], contextOrLegacy?: any) => {
  const context = typeof contextOrLegacy === 'string'
    ? { component: componentName, changedProps, context: contextOrLegacy }
    : { component: componentName, changedProps, ...contextOrLegacy };
  logger.debug(`Component updated: ${componentName}`, context);
};
