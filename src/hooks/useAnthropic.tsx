import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AnthropicRequest {
  message: string;
  model?: string;
  systemPrompt?: string;
  includeAnalytics?: boolean;
}

interface AnthropicResponse {
  generatedText: string;
  source: 'anthropic' | 'analytics' | 'fallback';
  model?: string;
  provider: 'anthropic';
  data?: unknown;
}

interface UseAnthropicOptions {
  functionName?: string;
  onSuccess?: (data: AnthropicResponse) => void;
  onError?: (error: Error) => void;
}

export const useAnthropic = (options: UseAnthropicOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    functionName = 'anthropic-chat',
    onSuccess,
    onError
  } = options;

  const invoke = async (request: AnthropicRequest): Promise<AnthropicResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await supabase.functions.invoke(functionName, {
        body: request
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data as AnthropicResponse;
      
      if (!data || !data.generatedText) {
        throw new Error('Invalid response from Anthropic function');
      }

      if (onSuccess) {
        onSuccess(data);
      }

      return data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Anthropic function error:', errorMessage);
      
      setError(errorMessage);

      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage));
      }

      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setError(null);
    setIsLoading(false);
  };

  return {
    invoke,
    isLoading,
    error,
    reset
  };
};

// Utility function to build Anthropic requests
export const buildAnthropicRequest = (
  message: string,
  options: {
    model?: string;
    systemPrompt?: string;
    includeAnalytics?: boolean;
  } = {}
): AnthropicRequest => {
  return {
    message,
    model: options.model || 'claude-3-5-sonnet-20241022',
    systemPrompt: options.systemPrompt,
    includeAnalytics: options.includeAnalytics || false
  };
};