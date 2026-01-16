/**
 * Error Logging and Reporting Service
 * Centralized error handling, logging, and reporting
 */

import type { 
  ErrorContext, 
  ErrorServiceConfig, 
  ErrorReportPayload,
  ApiError,
  NetworkError 
} from '@/types/error.types';

class ErrorService {
  private config: ErrorServiceConfig;
  private errorQueue: ErrorReportPayload[] = [];
  private lastErrorTime = 0;
  private errorCount = 0;
  private rateLimitMap = new Map<string, number>();

  constructor() {
    this.config = {
      environment: (import.meta.env.MODE as any) || 'production',
      enableConsoleLogging: import.meta.env.MODE !== 'production',
      enableRemoteLogging: import.meta.env.MODE === 'production',
      maxErrorsPerSession: 50,
      rateLimitMs: 5000 // 5 seconds between same errors
    };
  }

  public configure(config: Partial<ErrorServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public reportError(error: Error, context: Partial<ErrorContext> = {}): void {
    try {
      const errorKey = `${error.name}:${error.message}`;
      const now = Date.now();

      // Rate limiting - prevent spam of same error
      const lastReported = this.rateLimitMap.get(errorKey) || 0;
      if (now - lastReported < this.config.rateLimitMs) {
        return;
      }

      // Session error limit
      if (this.errorCount >= this.config.maxErrorsPerSession) {
        return;
      }

      this.rateLimitMap.set(errorKey, now);
      this.errorCount++;

      const errorContext: ErrorContext = {
        errorId: context.errorId || this.generateErrorId(),
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        level: context.level || 'error',
        ...context
      };

      const payload: ErrorReportPayload = {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        context: errorContext,
        environment: {
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: errorContext.timestamp,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          screen: {
            width: screen.width,
            height: screen.height
          }
        }
      };

      // Console logging
      if (this.config.enableConsoleLogging) {
        this.logToConsole(error, errorContext);
      }

      // Remote logging
      if (this.config.enableRemoteLogging) {
        this.sendToRemote(payload);
      }

      // Store in queue for batch processing
      this.errorQueue.push(payload);
      this.processErrorQueue();

    } catch {
      // Silently fail to avoid infinite loops - can't use logger here
    }
  }

  public reportApiError(error: ApiError, requestDetails?: any): void {
    const enhancedError = new Error(`API Error: ${error.message}`);
    enhancedError.name = 'ApiError';
    enhancedError.stack = new Error().stack;

    this.reportError(enhancedError, {
      level: error.statusCode >= 500 ? 'critical' : 'error',
      tags: {
        errorType: 'api',
        statusCode: error.statusCode.toString(),
        errorCode: error.code
      },
      extra: {
        apiError: error,
        requestDetails
      }
    });
  }

  public reportNetworkError(error: NetworkError, requestDetails?: any): void {
    const enhancedError = new Error(`Network Error: ${error.message}`);
    enhancedError.name = 'NetworkError';
    enhancedError.stack = error.stack;

    this.reportError(enhancedError, {
      level: 'error',
      tags: {
        errorType: 'network',
        statusCode: error.statusCode?.toString() || 'unknown'
      },
      extra: {
        networkError: error,
        requestDetails
      }
    });
  }

  public reportValidationError(errors: any[], context?: any): void {
    const validationError = new Error(`Validation failed: ${errors.length} errors`);
    validationError.name = 'ValidationError';

    this.reportError(validationError, {
      level: 'warning',
      tags: {
        errorType: 'validation'
      },
      extra: {
        validationErrors: errors,
        context
      }
    });
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private logToConsole(error: Error, context: ErrorContext): void {
    // Use structured logging instead of console groups
    const logData = {
      errorId: context.errorId,
      level: context.level,
      timestamp: context.timestamp,
      url: context.url,
      error: { name: error.name, message: error.message },
      ...(context.tags && { tags: context.tags }),
      ...(context.extra && { extra: context.extra })
    };
    
    // Log to console in development for visibility
    if (import.meta.env.MODE !== 'production') {
      console.group(`🚨 ${context.level.toUpperCase()} - ${context.errorId}`);
      console.error('Error:', error);
      console.info('Context:', logData);
      console.groupEnd();
    }
  }

  private async sendToRemote(payload: ErrorReportPayload): Promise<void> {
    try {
      if (!this.config.apiEndpoint) {
        return;
      }

      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Failed to send error report: ${response.statusText}`);
      }
    } catch {
      // Silently fail remote logging to avoid infinite loops
    }
  }

  private processErrorQueue(): void {
    // Process errors in batches to avoid overwhelming the service
    if (this.errorQueue.length >= 10) {
      this.flushErrorQueue();
    }

    // Auto-flush queue every 30 seconds
    setTimeout(() => {
      if (this.errorQueue.length > 0) {
        this.flushErrorQueue();
      }
    }, 30000);
  }

  private flushErrorQueue(): void {
    if (this.errorQueue.length === 0) return;

    // In a real implementation, this would batch send errors
    // For now, we just clear the queue
    this.errorQueue = [];
  }

  public getErrorStats(): {
    totalErrors: number;
    rateTotalHits: number;
    queueLength: number;
  } {
    return {
      totalErrors: this.errorCount,
      rateTotalHits: this.rateLimitMap.size,
      queueLength: this.errorQueue.length
    };
  }

  public clearErrorStats(): void {
    this.errorCount = 0;
    this.rateLimitMap.clear();
    this.errorQueue = [];
  }
}

// Global error handlers
const setupGlobalErrorHandlers = (errorService: ErrorService) => {
  // Unhandled JavaScript errors
  window.addEventListener('error', (event) => {
    errorService.reportError(event.error || new Error(event.message), {
      level: 'error',
      tags: {
        errorType: 'javascript',
        source: 'window.error'
      },
      extra: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    });
  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error ? 
      event.reason : 
      new Error(`Unhandled Promise Rejection: ${event.reason}`);

    errorService.reportError(error, {
      level: 'error',
      tags: {
        errorType: 'promise',
        source: 'unhandledrejection'
      }
    });
  });

  // Network errors
  window.addEventListener('offline', () => {
    errorService.reportError(new Error('Network connection lost'), {
      level: 'warning',
      tags: {
        errorType: 'network',
        source: 'offline'
      }
    });
  });
};

// Create singleton instance
export const errorService = new ErrorService();

// Setup global handlers in browser environment
if (typeof window !== 'undefined') {
  setupGlobalErrorHandlers(errorService);
}