import { useState, useCallback } from 'react';
import { FeatureState, FeatureError, FeatureHookReturn } from '../types/feature.types';
import { logger } from '@/lib/logger';

export interface UseFeatureStateOptions {
  featureName: string;
  initialData?: any;
  autoReset?: boolean;
}

export function useFeatureState<T = any>({
  featureName,
  initialData = null,
  autoReset = true
}: UseFeatureStateOptions): FeatureHookReturn<T> {
  const [state, setState] = useState<FeatureState<T>>({
    data: initialData,
    loading: false,
    error: null,
    initialized: false
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setData = useCallback((data: T | null) => {
    setState(prev => ({
      ...prev,
      data,
      loading: false,
      error: null,
      initialized: true
    }));
  }, []);

  const setError = useCallback((error: FeatureError | null) => {
    if (error) {
      logger.error(`${featureName}: Feature error`, error);
    }
    
    setState(prev => ({
      ...prev,
      error,
      loading: false,
      initialized: true
    }));
  }, [featureName]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const reset = useCallback(() => {
    setState({
      data: autoReset ? initialData : state.data,
      loading: false,
      error: null,
      initialized: false
    });
  }, [autoReset, initialData, state.data]);

  const refresh = useCallback(async () => {
    // This is a placeholder - specific features should override this
    logger.info(`${featureName}: Refresh requested`);
  }, [featureName]);

  return {
    ...state,
    setLoading,
    setData,
    setError,
    clearError,
    reset,
    refresh
  };
}