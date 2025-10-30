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
  // Example:
  // Sentry.captureException(new Error(message), { 
  //   level, 
  //   extra: context 
  // });
}

export const logger = {
  /**
   * Log debug information (development only)
   */
  log: (message: string, context?: LogContext) => {
    if (isDevelopment) {
      console.log(`[LOG] ${message}`, context || '');
    }
  },

  /**
   * Log informational messages (development only)
   */
  info: (message: string, context?: LogContext) => {
    if (isDevelopment) {
      console.info(`[INFO] ${message}`, context || '');
    }
  },

  /**
   * Log debug messages (development only)
   */
  debug: (message: string, context?: LogContext) => {
    if (isDevelopment) {
      console.debug(`[DEBUG] ${message}`, context || '');
    }
  },

  /**
   * Log warnings (always logged, sent to monitoring in production)
   */
  warn: (message: string, context?: LogContext) => {
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, context || '');
    } else {
      console.warn(message); // Minimal logging in production
      sendToMonitoring('warn', message, context);
    }
  },

  /**
   * Log errors (always logged, sent to monitoring in production)
   * CRITICAL: Always log errors for debugging, but minimize sensitive data
   */
  error: (message: string, error?: unknown, context?: LogContext) => {
    const formattedError = error ? formatError(error) : '';
    
    if (isDevelopment) {
      console.error(`[ERROR] ${message}`, formattedError, context || '');
    } else {
      // Production: log minimal info, send to monitoring
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
