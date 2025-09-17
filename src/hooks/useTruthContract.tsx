import { useState, useCallback } from 'react';
import { aiService, type AIRequest, type AIResponse } from '@/services/aiService';
import { useToast } from '@/components/ui/use-toast';

interface UseTruthContractOptions {
  onSuccess?: (response: AIResponse) => void;
  onError?: (error: Error) => void;
  onValidationFailed?: (response: AIResponse) => void;
}

export const useTruthContract = (options: UseTruthContractOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<AIResponse | null>(null);
  const { toast } = useToast();

  const { onSuccess, onError, onValidationFailed } = options;

  const processRequest = useCallback(async (request: AIRequest): Promise<AIResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Processing request with Truth Contract validation:', request);

      const response = await aiService.processRequest(request);
      setLastResponse(response);

      // Check if response passed truth validation
      if (!response.isValidated || !response.truthValidation?.isValid) {
        console.warn('Response failed Truth Contract validation:', response.truthValidation);
        
        // Show warning to user
        toast({
          title: "Content Validation Warning",
          description: `Response may contain inaccuracies (Score: ${response.truthValidation?.score || 0}%). Please review carefully.`,
          variant: "destructive"
        });

        if (onValidationFailed) {
          onValidationFailed(response);
        }

        // Still return the response but marked as unvalidated
        return response;
      }

      // Response passed validation
      if (response.truthValidation && response.truthValidation.score > 90) {
        toast({
          title: "High-Quality Response",
          description: `Content validated with ${response.truthValidation.score}% confidence`,
        });
      }

      if (onSuccess) {
        onSuccess(response);
      }

      return response;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Truth Contract processing error:', errorMessage);
      
      setError(errorMessage);

      // Show error to user
      toast({
        title: "Processing Failed",
        description: errorMessage,
        variant: "destructive"
      });

      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage));
      }

      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast, onSuccess, onError, onValidationFailed]);

  const getValidationSummary = useCallback(() => {
    if (!lastResponse?.truthValidation) return null;

    const validation = lastResponse.truthValidation;
    return {
      score: validation.score,
      isValid: validation.isValid,
      violations: validation.violations.length,
      criticalViolations: validation.violations.filter(v => v.severity === 'critical').length,
      recommendations: validation.recommendations,
      hasCorrections: !!lastResponse.originalContent
    };
  }, [lastResponse]);

  const reset = useCallback(() => {
    setError(null);
    setIsLoading(false);
    setLastResponse(null);
  }, []);

  return {
    processRequest,
    isLoading,
    error,
    lastResponse,
    getValidationSummary,
    reset
  };
};

// Utility hook for simple AI requests with truth contract
export const useAIWithTruthContract = () => {
  const { toast } = useToast();
  
  return useTruthContract({
    onValidationFailed: (response) => {
      console.warn('AI response failed validation:', response.truthValidation);
    },
    onError: (error) => {
      console.error('AI request failed:', error);
    }
  });
};

// Hook for generating content with truth contract validation
export const useValidatedContentGeneration = () => {
  const truthContract = useTruthContract();

  const generateContent = useCallback(async (
    prompt: string,
    data: any,
    options: {
      sensitivity?: 'public' | 'internal' | 'sensitive' | 'restricted';
      requiresAI?: boolean;
      context?: string;
    } = {}
  ) => {
    const request: AIRequest = {
      prompt,
      data,
      sensitivity: options.sensitivity || 'public',
      requiresAI: options.requiresAI !== false,
      context: options.context,
      parameters: {
        experienceSensitivity: 'high',
        industryFocus: 'recruitment',
        biasReduction: true,
        explainabilityLevel: 'comprehensive'
      }
    };

    return await truthContract.processRequest(request);
  }, [truthContract]);

  return {
    generateContent,
    isLoading: truthContract.isLoading,
    error: truthContract.error,
    lastResponse: truthContract.lastResponse,
    getValidationSummary: truthContract.getValidationSummary,
    reset: truthContract.reset
  };
};