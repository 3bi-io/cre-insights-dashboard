/**
 * Production Logger
 * 
 * Optimized for production use with minimal overhead.
 * All detailed logging is disabled for performance.
 * Only errors and warnings are logged to console.
 */

interface LogContext {
  [key: string]: unknown;
}

/**
 * Format error for logging
 */
function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Send error to monitoring service (disabled)
 */
function sendToMonitoring(_level: 'error' | 'warn', _message: string, _context?: LogContext) {
  // Monitoring disabled
}

export const logger = {
  /**
   * No-op for production (previously debug logs)
   */
  log: (_message: string, _contextOrData?: LogContext | unknown, _legacyContext?: string) => {
    // Production: no logging
  },

  /**
   * No-op for production (previously info logs)
   */
  info: (_message: string, _contextOrData?: LogContext | unknown, _legacyContext?: string) => {
    // Production: no logging
  },

  /**
   * No-op for production (previously debug logs)
   */
  debug: (_message: string, _contextOrData?: LogContext | unknown, _legacyContext?: string) => {
    // Production: no logging
  },

  /**
   * Log warnings and send to monitoring
   */
  warn: (message: string, contextOrData?: LogContext | unknown, legacyContext?: string) => {
    const ctx = legacyContext ? { context: legacyContext, ...contextOrData as LogContext } : contextOrData as LogContext;
    console.warn(message);
    sendToMonitoring('warn', message, ctx);
  },

  /**
   * Log errors and send to monitoring
   */
  error: (message: string, errorOrContext?: unknown, contextOrLegacy?: LogContext | string) => {
    let error: unknown;
    let context: LogContext | undefined;

    if (typeof contextOrLegacy === 'string') {
      error = errorOrContext;
      context = { context: contextOrLegacy };
    } else if (contextOrLegacy && typeof contextOrLegacy === 'object') {
      error = errorOrContext;
      context = contextOrLegacy;
    } else {
      error = errorOrContext;
      context = undefined;
    }

    const formattedError = error ? formatError(error) : '';
    console.error(message, formattedError);
    sendToMonitoring('error', `${message}: ${formattedError}`, context);
  },

  /**
   * Execute function without grouping in production
   */
  group: (_label: string, fn: () => void) => {
    fn();
  },

  /**
   * No-op timing in production
   */
  time: (_label: string) => {
    // Production: no timing
  },

  timeEnd: (_label: string) => {
    // Production: no timing
  },
};

// Export singleton instance
export default logger;
