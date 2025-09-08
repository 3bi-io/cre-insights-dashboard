/**
 * Error Handling Hooks
 * Standardized error handling patterns for React components
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { errorService } from '@/services/errorService';
import type { ErrorLevel, ApiError, NetworkError } from '@/types/error.types';

export interface UseErrorHandlerOptions {
  /** Default error level */
  level?: ErrorLevel;
  /** Component identifier for logging */
  component?: string;
  /** Additional context data */
  context?: Record<string, any>;
  /** Auto-clear errors after timeout */
  autoClearMs?: number;
  /** Maximum number of errors to store */
  maxErrors?: number;
}

export interface ErrorState {
  error: Error | null;
  errors: Error[];
  isError: boolean;
  errorId: string | null;
  lastErrorTime: Date | null;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const {
    level = 'error',
    component,
    context = {},
    autoClearMs,
    maxErrors = 5
  } = options;

  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    errors: [],
    isError: false,
    errorId: null,
    lastErrorTime: null
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const componentRef = useRef(component);

  useEffect(() => {
    componentRef.current = component;
  }, [component]);

  useEffect(() => {
    if (autoClearMs && errorState.isError) {
      timeoutRef.current = setTimeout(() => {
        clearErrors();
      }, autoClearMs);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [errorState.isError, autoClearMs]);

  const captureError = useCallback((
    error: Error | string, 
    additionalContext: Record<string, any> = {}
  ) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    errorService.reportError(errorObj, {
      errorId,
      level,
      errorBoundary: componentRef.current,
      tags: {
        component: componentRef.current || 'unknown',
        errorType: 'captured'
      },
      extra: {
        ...context,
        ...additionalContext
      }
    });

    setErrorState(prev => {
      const newErrors = [errorObj, ...prev.errors].slice(0, maxErrors);
      return {
        error: errorObj,
        errors: newErrors,
        isError: true,
        errorId,
        lastErrorTime: now
      };
    });
  }, [level, context, maxErrors]);

  const clearErrors = useCallback(() => {
    setErrorState({
      error: null,
      errors: [],
      isError: false,
      errorId: null,
      lastErrorTime: null
    });

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const clearError = useCallback((index: number) => {
    setErrorState(prev => {
      const newErrors = prev.errors.filter((_, i) => i !== index);
      const hasErrors = newErrors.length > 0;
      
      return {
        error: hasErrors ? newErrors[0] : null,
        errors: newErrors,
        isError: hasErrors,
        errorId: hasErrors ? prev.errorId : null,
        lastErrorTime: hasErrors ? prev.lastErrorTime : null
      };
    });
  }, []);

  const retry = useCallback(() => {
    clearErrors();
  }, [clearErrors]);

  return {
    ...errorState,
    captureError,
    clearErrors,
    clearError,
    retry
  };
}

export function useApiErrorHandler(options: UseErrorHandlerOptions = {}) {
  const errorHandler = useErrorHandler({ ...options, level: 'error' });

  const captureApiError = useCallback((
    error: ApiError,
    requestDetails?: any
  ) => {
    errorService.reportApiError(error, requestDetails);
    errorHandler.captureError(new Error(`API Error: ${error.message}`), {
      apiError: error,
      requestDetails
    });
  }, [errorHandler]);

  return {
    ...errorHandler,
    captureApiError
  };
}