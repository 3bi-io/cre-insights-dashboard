import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OpenAIRequest {
  message: string;
  model?: string;
  systemPrompt?: string;
  includeAnalytics?: boolean;
}

interface OpenAIResponse {
  generatedText: string;
  source: 'openai' | 'analytics' | 'fallback';
  model?: string;
  data?: any;
}

interface UseOpenAIOptions {
  functionName?: string;
  onSuccess?: (data: OpenAIResponse) => void;
  onError?: (error: Error) => void;
}

export const useOpenAI = (options: UseOpenAIOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    functionName = 'openai-chat',
    onSuccess,
    onError
  } = options;

  const invoke = async (request: OpenAIRequest): Promise<OpenAIResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await supabase.functions.invoke(functionName, {
        body: request
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data as OpenAIResponse;
      
      if (!data || !data.generatedText) {
        throw new Error('Invalid response from OpenAI function');
      }

      if (onSuccess) {
        onSuccess(data);
      }

      return data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('OpenAI function error:', errorMessage);
      
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

// Utility function to build OpenAI requests
export const buildOpenAIRequest = (
  message: string,
  options: {
    model?: string;
    systemPrompt?: string;
    includeAnalytics?: boolean;
  } = {}
): OpenAIRequest => {
  return {
    message,
    model: options.model || 'gpt-5-2025-08-07', // Updated to latest flagship model
    systemPrompt: options.systemPrompt,
    includeAnalytics: options.includeAnalytics || false
  };
};

// Utility function to format AI responses
export const formatAIResponse = (response: any): string => {
  if (typeof response === 'string') {
    return response;
  }

  if (response && typeof response.generatedText === 'string') {
    return response.generatedText;
  }

  if (response && typeof response.response === 'string') {
    return response.response;
  }

  return 'I apologize, but I couldn\'t process your request properly. Please try again.';
};