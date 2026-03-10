import { useState, useCallback } from 'react';
import { useOpenAI } from './useOpenAI';
import { useAnthropic } from './useAnthropic';
import { useElevenLabsVoice } from '@/features/elevenlabs/hooks';
import { useAIConnectionManager } from './useAIConnectionManager';
import { logger } from '@/lib/logger';

interface AIProviderOptions {
  preferredProvider?: 'openai' | 'anthropic' | 'auto';
  model?: string;
  systemPrompt?: string;
  includeAnalytics?: boolean;
}

export const useAIProviders = (options: AIProviderOptions = {}) => {
  const [activeProvider, setActiveProvider] = useState<'openai' | 'anthropic' | null>(null);
  
  const openai = useOpenAI();
  const anthropic = useAnthropic();
  const voice = useElevenLabsVoice();
  const connectionManager = useAIConnectionManager();

  const { preferredProvider = 'auto', model, systemPrompt, includeAnalytics } = options;

  const selectProvider = useCallback((): 'openai' | 'anthropic' => {
    if (preferredProvider === 'auto') {
      const recommended = connectionManager.getRecommendedProvider();
      return recommended === 'openai' || recommended === 'anthropic' ? recommended : 'openai';
    }
    return preferredProvider === 'openai' || preferredProvider === 'anthropic' ? preferredProvider : 'openai';
  }, [preferredProvider, connectionManager]);

  const invoke = useCallback(async (message: string, customOptions?: Partial<AIProviderOptions>) => {
    const selectedProvider = customOptions?.preferredProvider || selectProvider();
    const actualProvider = selectedProvider === 'auto' ? selectProvider() : selectedProvider;
    setActiveProvider(actualProvider as 'openai' | 'anthropic');

    const requestOptions = {
      message,
      model: customOptions?.model || model,
      systemPrompt: customOptions?.systemPrompt || systemPrompt,
      includeAnalytics: customOptions?.includeAnalytics || includeAnalytics
    };

    try {
      if (actualProvider === 'anthropic') {
        return await anthropic.invoke(requestOptions);
      } else {
        return await openai.invoke(requestOptions);
      }
    } catch (error) {
      logger.warn(`AI provider ${actualProvider} failed, trying fallback`, { provider: actualProvider, context: 'useAIProviders' });
      
      // Fallback to the other provider
      const fallbackProvider = actualProvider === 'openai' ? 'anthropic' : 'openai';
      setActiveProvider(fallbackProvider);
      
      if (fallbackProvider === 'anthropic') {
        return await anthropic.invoke(requestOptions);
      } else {
        return await openai.invoke(requestOptions);
      }
    }
  }, [selectProvider, model, systemPrompt, includeAnalytics, openai, anthropic]);

  const isLoading = openai.isLoading || anthropic.isLoading;
  const error = openai.error || anthropic.error;

  const reset = useCallback(() => {
    openai.reset();
    anthropic.reset();
    setActiveProvider(null);
  }, [openai, anthropic]);

  const getProviderStatus = useCallback(() => {
    const health = connectionManager.getHealthSummary();
    return {
      totalProviders: health.totalProviders,
      connectedProviders: health.connectedProviders,
      healthPercentage: health.healthPercentage,
      recommendedProvider: connectionManager.getRecommendedProvider(),
      activeProvider,
      connections: connectionManager.connectionStatuses
    };
  }, [connectionManager, activeProvider]);

  return {
    // Core AI methods
    invoke,
    isLoading,
    error,
    reset,
    
    // Provider management
    activeProvider,
    selectProvider,
    getProviderStatus,
    
    // Individual provider access
    openai,
    anthropic,
    voice,
    connectionManager,
    
    // Convenience methods
    invokeOpenAI: (message: string, opts?: any) => invoke(message, { ...opts, preferredProvider: 'openai' }),
    invokeAnthropic: (message: string, opts?: any) => invoke(message, { ...opts, preferredProvider: 'anthropic' }),
  };
};