// Centralized logging service with different log levels and environment handling

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
  context?: string;
}

class LoggerService {
  private isDevelopment = import.meta.env.DEV;
  private logLevel: LogLevel = this.isDevelopment ? 'debug' : 'error';

  private formatMessage(level: LogLevel, message: string, context?: string): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    return `${timestamp} ${level.toUpperCase()} ${contextStr} ${message}`;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    return levels[level] >= levels[this.logLevel];
  }

  private createLogEntry(level: LogLevel, message: string, data?: unknown, context?: string): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      context,
    };
  }

  debug(message: string, data?: unknown, context?: string): void {
    if (this.shouldLog('debug')) {
      const logEntry = this.createLogEntry('debug', message, data, context);
      if (this.isDevelopment) {
        console.log(this.formatMessage('debug', message, context), data || '');
      }
      this.sendToLoggingService(logEntry);
    }
  }

  info(message: string, data?: unknown, context?: string): void {
    if (this.shouldLog('info')) {
      const logEntry = this.createLogEntry('info', message, data, context);
      if (this.isDevelopment) {
        console.info(this.formatMessage('info', message, context), data || '');
      }
      this.sendToLoggingService(logEntry);
    }
  }

  warn(message: string, data?: unknown, context?: string): void {
    if (this.shouldLog('warn')) {
      const logEntry = this.createLogEntry('warn', message, data, context);
      console.warn(this.formatMessage('warn', message, context), data || '');
      this.sendToLoggingService(logEntry);
    }
  }

  error(message: string, error?: unknown, context?: string): void {
    if (this.shouldLog('error')) {
      const logEntry = this.createLogEntry('error', message, error, context);
      console.error(this.formatMessage('error', message, context), error || '');
      this.sendToLoggingService(logEntry);
    }
  }

  // Performance logging
  time(label: string): void {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
  }

  // Group logging for related operations
  group(label: string): void {
    if (this.isDevelopment) {
      console.group(label);
    }
  }

  groupEnd(): void {
    if (this.isDevelopment) {
      console.groupEnd();
    }
  }

  // Send logs to external logging service (placeholder for future implementation)
  private sendToLoggingService(logEntry: LogEntry): void {
    // TODO: Implement external logging service integration
    // This could send logs to services like LogRocket, Sentry, or custom backend
    if (!this.isDevelopment && logEntry.level === 'error') {
      // In production, we might want to send errors to an external service
      // fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(logEntry)
      // }).catch(() => {
      //   // Silently fail to avoid infinite loops
      // });
    }
  }

  // Set log level dynamically
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  // Get current log level
  getLogLevel(): LogLevel {
    return this.logLevel;
  }
}

// Create singleton instance
export const logger = new LoggerService();

// Export types for use in other files
export type { LogLevel, LogEntry };