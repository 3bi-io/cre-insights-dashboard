/**
 * Standardized Error Handling Utilities
 * Provides consistent error handling patterns across the application
 */

import { toast } from '@/hooks/use-toast';

// Standard error types for the application
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION', 
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN'
}

// Standard error severity levels
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Standardized error structure
export interface StandardError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  code?: string | number;
  details?: any;
  timestamp: Date;
  context?: Record<string, any>;
}

/**
 * Creates a standardized error from various input types
 */
export function createStandardError(
  error: any, 
  context?: Record<string, any>
): StandardError {
  // Handle Supabase errors
  if (error?.code) {
    return {
      type: mapSupabaseErrorType(error.code),
      severity: mapSupabaseErrorSeverity(error.code),
      message: error.message || 'Database operation failed',
      userMessage: getUserFriendlyMessage(error.code, error.message),
      code: error.code,
      details: error.details || error.hint,
      timestamp: new Date(),
      context
    };
  }

  // Handle HTTP errors
  if (error?.status) {
    return {
      type: mapHttpErrorType(error.status),
      severity: mapHttpErrorSeverity(error.status),
      message: error.message || `HTTP ${error.status}`,
      userMessage: getHttpUserMessage(error.status),
      code: error.status,
      details: error.data,
      timestamp: new Date(),
      context
    };
  }

  // Handle standard JavaScript errors
  if (error instanceof Error) {
    return {
      type: ErrorType.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      message: error.message,
      userMessage: 'An unexpected error occurred. Please try again.',
      details: {
        name: error.name,
        stack: error.stack
      },
      timestamp: new Date(),
      context
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      type: ErrorType.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      message: error,
      userMessage: 'An error occurred. Please try again.',
      timestamp: new Date(),
      context
    };
  }

  // Fallback for unknown error types
  return {
    type: ErrorType.UNKNOWN,
    severity: ErrorSeverity.MEDIUM,
    message: 'Unknown error occurred',
    userMessage: 'An unexpected error occurred. Please try again.',
    details: error,
    timestamp: new Date(),
    context
  };
}

/**
 * Handles errors consistently across the application
 */
export function handleError(
  error: any,
  context?: Record<string, any>,
  options: {
    showToast?: boolean;
    logError?: boolean;
    throwError?: boolean;
  } = {}
): StandardError {
  const { showToast = true, logError = true, throwError = false } = options;
  
  const standardError = createStandardError(error, context);

  // Log error if enabled
  if (logError) {
    console.error('[Error Handler]', {
      type: standardError.type,
      severity: standardError.severity,
      message: standardError.message,
      code: standardError.code,
      context: standardError.context,
      timestamp: standardError.timestamp,
      details: standardError.details
    });
  }

  // Show toast notification if enabled
  if (showToast) {
    const toastVariant = standardError.severity === ErrorSeverity.CRITICAL || 
                        standardError.severity === ErrorSeverity.HIGH 
                        ? 'destructive' 
                        : 'default';
    
    toast({
      variant: toastVariant,
      title: getErrorTitle(standardError.type),
      description: standardError.userMessage,
      duration: getToastDuration(standardError.severity)
    });
  }

  // Throw error if requested (useful for query error boundaries)
  if (throwError) {
    throw new Error(standardError.message);
  }

  return standardError;
}

/**
 * Async wrapper that handles errors consistently
 */
export async function withErrorHandling<T>(
  asyncFn: () => Promise<T>,
  context?: Record<string, any>,
  options?: {
    showToast?: boolean;
    logError?: boolean;
    fallbackValue?: T;
  }
): Promise<T> {
  const { showToast = true, logError = true, fallbackValue } = options || {};
  
  try {
    return await asyncFn();
  } catch (error) {
    const standardError = handleError(error, context, { 
      showToast, 
      logError, 
      throwError: false 
    });
    
    if (fallbackValue !== undefined) {
      return fallbackValue;
    }
    
    throw standardError;
  }
}

/**
 * Retry wrapper with exponential backoff
 */
export async function withRetry<T>(
  asyncFn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
    retryCondition?: (error: any) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    retryCondition = (error) => {
      // Don't retry client errors (4xx) or authentication errors
      if (error?.status >= 400 && error?.status < 500) return false;
      if (error?.code === 'PGRST301') return false; // Auth error
      return true;
    }
  } = options;

  let lastError: any;
  let delay = baseDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await asyncFn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on last attempt or if retry condition fails
      if (attempt === maxRetries || !retryCondition(error)) {
        throw error;
      }

      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError;
}

// Helper functions for error mapping
function mapSupabaseErrorType(code: string): ErrorType {
  if (code.startsWith('PGRST1')) return ErrorType.AUTHENTICATION;
  if (code.startsWith('PGRST3')) return ErrorType.AUTHORIZATION;  
  if (code === '23505') return ErrorType.CONFLICT;
  if (code === '23503') return ErrorType.VALIDATION;
  if (code.startsWith('42')) return ErrorType.SERVER;
  return ErrorType.SERVER;
}

function mapSupabaseErrorSeverity(code: string): ErrorSeverity {
  if (code.startsWith('PGRST1')) return ErrorSeverity.HIGH;
  if (code === '23505') return ErrorSeverity.MEDIUM;
  if (code.startsWith('42')) return ErrorSeverity.HIGH;
  return ErrorSeverity.MEDIUM;
}

function mapHttpErrorType(status: number): ErrorType {
  if (status === 401) return ErrorType.AUTHENTICATION;
  if (status === 403) return ErrorType.AUTHORIZATION;
  if (status === 404) return ErrorType.NOT_FOUND;
  if (status === 409) return ErrorType.CONFLICT;
  if (status >= 400 && status < 500) return ErrorType.CLIENT;
  if (status >= 500) return ErrorType.SERVER;
  return ErrorType.NETWORK;
}

function mapHttpErrorSeverity(status: number): ErrorSeverity {
  if (status === 401 || status === 403) return ErrorSeverity.HIGH;
  if (status >= 500) return ErrorSeverity.HIGH;
  if (status >= 400) return ErrorSeverity.MEDIUM;
  return ErrorSeverity.LOW;
}

function getUserFriendlyMessage(code: string, message: string): string {
  const friendlyMessages: Record<string, string> = {
    'PGRST301': 'Authentication required. Please sign in.',
    'PGRST302': 'Access denied. You don\'t have permission.',
    '23505': 'This item already exists.',
    '23503': 'Referenced item not found.',
    'P0001': 'Invalid data provided.',
    '42P01': 'Database configuration error.',
  };
  
  return friendlyMessages[code] || message || 'An error occurred. Please try again.';
}

function getHttpUserMessage(status: number): string {
  const messages: Record<number, string> = {
    400: 'Invalid request. Please check your input.',
    401: 'Authentication required. Please sign in.',
    403: 'Access denied. You don\'t have permission.',
    404: 'The requested item was not found.',
    409: 'Conflict detected. The item may already exist.',
    429: 'Too many requests. Please try again later.',
    500: 'Server error. Please try again later.',
    502: 'Service unavailable. Please try again later.',
    503: 'Service temporarily unavailable.',
  };
  
  return messages[status] || `Request failed with status ${status}`;
}

function getErrorTitle(type: ErrorType): string {
  const titles: Record<ErrorType, string> = {
    [ErrorType.NETWORK]: 'Connection Error',
    [ErrorType.VALIDATION]: 'Validation Error',
    [ErrorType.AUTHENTICATION]: 'Authentication Required',
    [ErrorType.AUTHORIZATION]: 'Access Denied',
    [ErrorType.NOT_FOUND]: 'Not Found',
    [ErrorType.CONFLICT]: 'Conflict Error',
    [ErrorType.SERVER]: 'Server Error',
    [ErrorType.CLIENT]: 'Request Error',
    [ErrorType.UNKNOWN]: 'Error'
  };
  
  return titles[type];
}

function getToastDuration(severity: ErrorSeverity): number {
  const durations: Record<ErrorSeverity, number> = {
    [ErrorSeverity.LOW]: 3000,
    [ErrorSeverity.MEDIUM]: 5000,
    [ErrorSeverity.HIGH]: 7000,
    [ErrorSeverity.CRITICAL]: 10000
  };
  
  return durations[severity];
}