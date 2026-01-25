import { useEffect, useRef, useMemo } from 'react';
import { toast } from '@/hooks/use-toast';

export type DataLoadingStateType = 'loading' | 'error' | 'empty' | 'success';

export interface UseDataLoadingStateOptions<T> {
  data: T | undefined | null;
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  refetch?: () => void;
  emptyCheck?: (data: T) => boolean;
  dataLabel?: string;
  showErrorToast?: boolean;
}

export interface DataLoadingState<T> {
  state: DataLoadingStateType;
  data: T | null;
  isEmpty: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  retry: () => void;
  errorMessage: string;
}

/**
 * Default empty check function that handles common data types
 */
function defaultEmptyCheck<T>(data: T): boolean {
  if (data === null || data === undefined) return true;
  if (Array.isArray(data)) return data.length === 0;
  if (typeof data === 'object') return Object.keys(data).length === 0;
  return false;
}

/**
 * Hook for unified data loading state management.
 * Wraps React Query state and provides consistent loading/error/empty detection
 * with automatic toast notifications on fetch failures.
 */
export function useDataLoadingState<T>(
  options: UseDataLoadingStateOptions<T>
): DataLoadingState<T> {
  const {
    data,
    isLoading,
    isError,
    error = null,
    refetch,
    emptyCheck,
    dataLabel = 'data',
    showErrorToast = true,
  } = options;

  // Track if we've shown an error toast to prevent duplicates
  const hasShownErrorToast = useRef(false);

  // Show toast on error (only once per error state)
  useEffect(() => {
    if (isError && showErrorToast && !hasShownErrorToast.current) {
      hasShownErrorToast.current = true;
      toast({
        title: 'Failed to load data',
        description: `Unable to load ${dataLabel}. Please try again.`,
        variant: 'destructive',
      });
    }
    
    // Reset the flag when error clears
    if (!isError) {
      hasShownErrorToast.current = false;
    }
  }, [isError, showErrorToast, dataLabel]);

  // Determine if data is empty
  const isEmpty = useMemo(() => {
    if (isLoading || isError) return false;
    if (data === null || data === undefined) return true;
    
    const checkFn = emptyCheck || defaultEmptyCheck;
    return checkFn(data);
  }, [data, isLoading, isError, emptyCheck]);

  // Unified state enum
  const state: DataLoadingStateType = useMemo(() => {
    if (isLoading) return 'loading';
    if (isError) return 'error';
    if (isEmpty) return 'empty';
    return 'success';
  }, [isLoading, isError, isEmpty]);

  // Error message
  const errorMessage = useMemo(() => {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return `Failed to load ${dataLabel}`;
  }, [error, dataLabel]);

  // Retry function with fallback
  const retry = () => {
    if (refetch) {
      hasShownErrorToast.current = false; // Allow toast on next error
      refetch();
    }
  };

  return {
    state,
    data: data ?? null,
    isEmpty,
    isLoading,
    isError,
    error: error instanceof Error ? error : null,
    retry,
    errorMessage,
  };
}
