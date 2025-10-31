/**
 * Environment-Aware Logger
 * 
 * SECURITY: Prevents sensitive data exposure in production by only
 * logging detailed information in development mode.
 * 
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.log('Debug info', data);
 *   logger.error('Error occurred', error);
 *   logger.warn('Warning message');
 */

const isDevelopment = import.meta.env.MODE === 'development';
const isTest = import.meta.env.MODE === 'test';

interface LogContext {
  [key: string]: any;
}

/**
 * Format error for logging
 */
function formatError(error: unknown): string {
  if (error instanceof Error) {
    return isDevelopment ? error.stack || error.message : error.message;
  }
  return String(error);
}

/**
 * Send error to monitoring service (production only)
 */
function sendToMonitoring(level: 'error' | 'warn', message: string, context?: LogContext) {
  if (isDevelopment || isTest) return;
  
  // TODO: Integrate with error monitoring service (Sentry, LogRocket, etc.)
}

export const logger = {
  /**
   * Log debug information (development only)
   * Supports both 2-arg and legacy 3-arg signatures
   */
  log: (message: string, contextOrData?: LogContext | any, legacyContext?: string) => {
    if (isDevelopment) {
      const ctx = legacyContext ? { context: legacyContext, ...contextOrData } : contextOrData;
      console.log(`[LOG] ${message}`, ctx || '');
    }
  },

  /**
   * Log informational messages (development only)
   * Supports both 2-arg and legacy 3-arg signatures
   */
  info: (message: string, contextOrData?: LogContext | any, legacyContext?: string) => {
    if (isDevelopment) {
      const ctx = legacyContext ? { context: legacyContext, ...contextOrData } : contextOrData;
      console.info(`[INFO] ${message}`, ctx || '');
    }
  },

  /**
   * Log debug messages (development only)
   * Supports both 2-arg and legacy 3-arg signatures
   */
  debug: (message: string, contextOrData?: LogContext | any, legacyContext?: string) => {
    if (isDevelopment) {
      const ctx = legacyContext ? { context: legacyContext, ...contextOrData } : contextOrData;
      console.debug(`[DEBUG] ${message}`, ctx || '');
    }
  },

  /**
   * Log warnings (always logged, sent to monitoring in production)
   * Supports both 2-arg and legacy 3-arg signatures
   */
  warn: (message: string, contextOrData?: LogContext | any, legacyContext?: string) => {
    const ctx = legacyContext ? { context: legacyContext, ...contextOrData } : contextOrData;
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, ctx || '');
    } else {
      console.warn(message);
      sendToMonitoring('warn', message, ctx);
    }
  },

  /**
   * Log errors (always logged, sent to monitoring in production)
   * Supports both 2-arg and legacy 3-arg signatures
   * CRITICAL: Always log errors for debugging, but minimize sensitive data
   */
  error: (message: string, errorOrContext?: unknown, contextOrLegacy?: LogContext | string) => {
    let error: unknown;
    let context: LogContext | undefined;

    // Handle different signatures
    if (typeof contextOrLegacy === 'string') {
      // 3-arg legacy: (message, error, 'Context')
      error = errorOrContext;
      context = { context: contextOrLegacy };
    } else if (contextOrLegacy && typeof contextOrLegacy === 'object') {
      // 3-arg new: (message, error, { context })
      error = errorOrContext;
      context = contextOrLegacy;
    } else {
      // 2-arg: (message, error)
      error = errorOrContext;
      context = undefined;
    }

    const formattedError = error ? formatError(error) : '';
    
    if (isDevelopment) {
      console.error(`[ERROR] ${message}`, formattedError, context || '');
    } else {
      console.error(message, formattedError);
      sendToMonitoring('error', `${message}: ${formattedError}`, context);
    }
  },

  /**
   * Group related logs (development only)
   */
  group: (label: string, fn: () => void) => {
    if (isDevelopment) {
      console.group(label);
      fn();
      console.groupEnd();
    } else {
      fn();
    }
  },

  /**
   * Time execution (development only)
   */
  time: (label: string) => {
    if (isDevelopment) {
      console.time(label);
    }
  },

  timeEnd: (label: string) => {
    if (isDevelopment) {
      console.timeEnd(label);
    }
  },
};

// Export singleton instance
export default logger;
