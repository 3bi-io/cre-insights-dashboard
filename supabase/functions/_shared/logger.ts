/**
 * Structured Logging Utilities for Edge Functions
 * Provides consistent, searchable logging format
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    name?: string;
  };
}

/**
 * Format log entry as structured JSON
 */
function formatLogEntry(entry: LogEntry): string {
  return JSON.stringify(entry);
}

/**
 * Format error object for logging
 */
function formatError(error: unknown): LogEntry['error'] {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      name: error.name,
    };
  }
  return {
    message: String(error),
  };
}

/**
 * Edge Function Logger
 */
export class EdgeLogger {
  private functionName: string;
  private defaultContext: LogContext;

  constructor(functionName: string, defaultContext: LogContext = {}) {
    this.functionName = functionName;
    this.defaultContext = defaultContext;
  }

  /**
   * Log at specified level
   */
  private log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: unknown
  ): void {
    const entry: LogEntry = {
      level,
      message: `[${this.functionName}] ${message}`,
      timestamp: new Date().toISOString(),
      context: {
        ...this.defaultContext,
        ...context,
      },
    };

    if (error) {
      entry.error = formatError(error);
    }

    const formatted = formatLogEntry(entry);

    switch (level) {
      case 'debug':
      case 'info':
        console.log(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  /**
   * Log error message
   */
  error(message: string, error?: unknown, context?: LogContext): void {
    this.log('error', message, context, error);
  }

  /**
   * Log API request
   */
  apiRequest(method: string, url: string, context?: LogContext): void {
    this.info(`API Request: ${method} ${url}`, {
      type: 'api_request',
      method,
      url,
      ...context,
    });
  }

  /**
   * Log API response
   */
  apiResponse(
    method: string,
    url: string,
    status: number,
    duration?: number,
    context?: LogContext
  ): void {
    const level = status >= 400 ? 'error' : 'info';
    this.log(level, `API Response: ${method} ${url} - ${status}`, {
      type: 'api_response',
      method,
      url,
      status,
      ...(duration && { duration }),
      ...context,
    });
  }

  /**
   * Log database query
   */
  dbQuery(operation: string, table: string, context?: LogContext): void {
    this.debug(`DB Query: ${operation} on ${table}`, {
      type: 'db_query',
      operation,
      table,
      ...context,
    });
  }

  /**
   * Log performance metric
   */
  performance(operation: string, duration: number, context?: LogContext): void {
    this.info(`Performance: ${operation} took ${duration}ms`, {
      type: 'performance',
      operation,
      duration,
      ...context,
    });
  }

  /**
   * Create child logger with additional context
   */
  child(additionalContext: LogContext): EdgeLogger {
    return new EdgeLogger(this.functionName, {
      ...this.defaultContext,
      ...additionalContext,
    });
  }
}

/**
 * Create logger for edge function
 */
export function createLogger(
  functionName: string,
  context?: LogContext
): EdgeLogger {
  return new EdgeLogger(functionName, context);
}

/**
 * Measure execution time of async operation
 */
export async function measureTime<T>(
  logger: EdgeLogger,
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    logger.performance(operation, duration);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`${operation} failed after ${duration}ms`, error);
    throw error;
  }
}
