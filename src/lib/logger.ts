/**
 * Production Logger
 * 
 * Optimized for production use with Sentry integration.
 * All detailed logging is disabled for performance.
 * Only errors and warnings are sent to monitoring.
 */

interface LogContext {
  [key: string]: any;
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
 * Send error to monitoring service.
 * Guarded against recursion and gated to production-only.
 */
let _isForwarding = false;

function sendToMonitoring(level: 'error' | 'warn', message: string, context?: LogContext) {
  // Gate: only forward in production with a configured DSN
  if (import.meta.env.MODE !== 'production' || !import.meta.env.VITE_SENTRY_DSN) return;
  // Anti-recursion guard
  if (_isForwarding) return;
  _isForwarding = true;

  import('@/utils/sentry').then(({ captureMessage, captureException }) => {
    if (level === 'error') {
      captureException(new Error(message), context);
    } else {
      captureMessage(message, 'warning' as any, context);
    }
  }).catch(() => {
    // Silently fail
  }).finally(() => {
    _isForwarding = false;
  });
}

export const logger = {
  /**
   * No-op for production (previously debug logs)
   */
  log: (_message: string, _contextOrData?: LogContext | any, _legacyContext?: string) => {
    // Production: no logging
  },

  /**
   * No-op for production (previously info logs)
   */
  info: (_message: string, _contextOrData?: LogContext | any, _legacyContext?: string) => {
    // Production: no logging
  },

  /**
   * No-op for production (previously debug logs)
   */
  debug: (_message: string, _contextOrData?: LogContext | any, _legacyContext?: string) => {
    // Production: no logging
  },

  /**
   * Log warnings and send to monitoring
   */
  warn: (message: string, contextOrData?: LogContext | any, legacyContext?: string) => {
    const ctx = legacyContext ? { context: legacyContext, ...contextOrData } : contextOrData;
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
