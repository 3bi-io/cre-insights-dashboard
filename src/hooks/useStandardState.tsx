/**
 * Standardized State Management Hooks
 * Provides consistent state patterns across the application
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { handleError, withErrorHandling } from '@/utils/errorHandling';

// Standard loading states
export interface LoadingState {
  isLoading: boolean;
  isValidating: boolean;
  isRefreshing: boolean;
}

// Standard error state
export interface ErrorState {
  hasError: boolean;
  error: any;
  errorMessage: string;
}

// Standard data state
export interface DataState<T> {
  data: T | null;
  loading: LoadingState;
  error: ErrorState;
  lastUpdated: Date | null;
}

// Options for async operations
export interface AsyncOptions {
  showErrorToast?: boolean;
  logError?: boolean;
  retries?: number;
  retryDelay?: number;
}

/**
 * Standard async state hook with consistent error handling
 */
export function useAsyncState<T>(
  initialData: T | null = null
) {
  const [state, setState] = useState<DataState<T>>({
    data: initialData,
    loading: {
      isLoading: false,
      isValidating: false, 
      isRefreshing: false
    },
    error: {
      hasError: false,
      error: null,
      errorMessage: ''
    },
    lastUpdated: initialData ? new Date() : null
  });

  const setLoading = useCallback((type: keyof LoadingState, value: boolean) => {
    setState(prev => ({
      ...prev,
      loading: {
        ...prev.loading,
        [type]: value
      }
    }));
  }, []);

  const setData = useCallback((data: T) => {
    setState(prev => ({
      ...prev,
      data,
      lastUpdated: new Date(),
      error: {
        hasError: false,
        error: null,
        errorMessage: ''
      }
    }));
  }, []);

  const setError = useCallback((error: any) => {
    const standardError = handleError(error, {}, { 
      showToast: false, 
      throwError: false 
    });
    
    setState(prev => ({
      ...prev,
      error: {
        hasError: true,
        error: standardError,
        errorMessage: standardError.userMessage
      },
      loading: {
        isLoading: false,
        isValidating: false,
        isRefreshing: false
      }
    }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: {
        hasError: false,
        error: null,
        errorMessage: ''
      }
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: {
        isLoading: false,
        isValidating: false,
        isRefreshing: false
      },
      error: {
        hasError: false,
        error: null,
        errorMessage: ''
      },
      lastUpdated: initialData ? new Date() : null
    });
  }, [initialData]);

  return {
    ...state,
    setLoading,
    setData,
    setError,
    clearError,
    reset
  };
}

/**
 * Standard async operation hook with consistent patterns
 */
export function useAsyncOperation<T, P extends any[] = []>(
  asyncFn: (...args: P) => Promise<T>,
  options: AsyncOptions = {}
) {
  const {
    showErrorToast = true,
    logError = true,
    retries = 0,
    retryDelay = 1000
  } = options;

  const asyncState = useAsyncState<T>();
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async (...args: P): Promise<T | null> => {
    // Cancel any ongoing operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    asyncState.clearError();
    asyncState.setLoading('isLoading', true);

    try {
      const result = await withErrorHandling(
        () => asyncFn(...args),
        { operation: asyncFn.name, args },
        { 
          showToast: showErrorToast, 
          logError 
        }
      );

      // Check if operation was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return null;
      }

      asyncState.setData(result);
      asyncState.setLoading('isLoading', false);
      return result;
    } catch (error) {
      // Check if operation was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return null;
      }

      asyncState.setError(error);
      return null;
    }
  }, [asyncFn, asyncState, showErrorToast, logError]);

  const refresh = useCallback(async (...args: P): Promise<T | null> => {
    asyncState.setLoading('isRefreshing', true);
    const result = await execute(...args);
    asyncState.setLoading('isRefreshing', false);
    return result;
  }, [execute, asyncState]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    asyncState.setLoading('isLoading', false);
    asyncState.setLoading('isRefreshing', false);
  }, [asyncState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...asyncState,
    execute,
    refresh,
    cancel,
    isIdle: !asyncState.loading.isLoading && !asyncState.loading.isRefreshing
  };
}

/**
 * Standard form state hook with validation
 */
export function useFormState<T extends Record<string, any>>(
  initialValues: T,
  validator?: (values: T) => Record<string, string> | null
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const setFieldTouched = useCallback((field: keyof T, isTouched = true) => {
    setTouched(prev => ({ ...prev, [field]: isTouched }));
  }, []);

  const validate = useCallback(() => {
    if (!validator) return true;
    
    const validationErrors = validator(values);
    if (validationErrors) {
      setErrors(validationErrors);
      return false;
    }
    
    setErrors({});
    return true;
  }, [validator, values]);

  const handleSubmit = useCallback(async (
    onSubmit: (values: T) => Promise<void> | void
  ) => {
    setIsSubmitting(true);
    
    // Mark all fields as touched
    const touchedFields = Object.keys(values).reduce((acc, key) => ({
      ...acc,
      [key]: true
    }), {});
    setTouched(touchedFields);

    try {
      const isValid = validate();
      if (!isValid) {
        setIsSubmitting(false);
        return;
      }

      await onSubmit(values);
    } catch (error) {
      handleError(error, { formValues: values });
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const getFieldError = useCallback((field: keyof T) => {
    return touched[field as string] ? errors[field as string] : undefined;
  }, [errors, touched]);

  const hasErrors = Object.keys(errors).length > 0;
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    hasErrors,
    isDirty,
    setValue,
    setFieldTouched,
    validate,
    handleSubmit,
    reset,
    getFieldError
  };
}

/**
 * Standard pagination state hook
 */
export function usePaginationState(
  initialPage = 1,
  initialPageSize = 20
) {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [total, setTotal] = useState(0);

  const totalPages = Math.ceil(total / pageSize);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);

  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setPage(prev => prev + 1);
    }
  }, [hasNextPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setPage(prev => prev - 1);
    }
  }, [hasPreviousPage]);

  const changePageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when page size changes
  }, []);

  const reset = useCallback(() => {
    setPage(initialPage);
    setPageSize(initialPageSize);
    setTotal(0);
  }, [initialPage, initialPageSize]);

  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    startIndex,
    endIndex,
    setTotal,
    goToPage,
    nextPage,
    previousPage,
    changePageSize,
    reset
  };
}