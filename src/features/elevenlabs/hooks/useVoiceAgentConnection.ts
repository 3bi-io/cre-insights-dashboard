/**
 * Voice Agent Connection Hook
 * Manages connection state and lifecycle for ElevenLabs voice agents
 */

import { useState, useCallback } from 'react';
import { useConversation } from '@11labs/react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { parseVoiceAgentError, getErrorTitle, getUserFriendlyErrorMessage } from '../utils/errorHandling';
import { checkBrowserCompatibility } from '../utils/browserCompatibility';
import { SignedUrlResponse } from '../types';

interface UseVoiceAgentConnectionOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
  agentOverrides?: any;
}

export function useVoiceAgentConnection(options: UseVoiceAgentConnectionOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const conversation = useConversation({
    overrides: options.agentOverrides,
    onConnect: () => {
      logger.info('Voice agent connected', undefined, 'VoiceAgentConnection');
      setIsConnected(true);
      setIsConnecting(false);
      options.onConnect?.();
    },
    onDisconnect: () => {
      logger.info('Voice agent disconnected', undefined, 'VoiceAgentConnection');
      setIsConnected(false);
      setIsConnecting(false);
      options.onDisconnect?.();
    },
    onMessage: (message) => {
      logger.debug('Voice agent message', { message }, 'VoiceAgentConnection');
    },
    onError: (error) => {
      logger.error('Voice agent error', error, 'VoiceAgentConnection');
      setIsConnecting(false);
      const parsedError = parseVoiceAgentError(error);
      options.onError?.(parsedError);
    }
  });

  const requestMicrophoneAccess = useCallback(async (): Promise<boolean> => {
    try {
      logger.debug('Requesting microphone access', undefined, 'VoiceAgentConnection');
      await navigator.mediaDevices.getUserMedia({ audio: true });
      logger.debug('Microphone access granted', undefined, 'VoiceAgentConnection');
      return true;
    } catch (error) {
      logger.error('Microphone access denied', error, 'VoiceAgentConnection');
      const parsedError = parseVoiceAgentError(error);
      toast({
        title: getErrorTitle(parsedError),
        description: getUserFriendlyErrorMessage(parsedError),
        variant: 'destructive'
      });
      return false;
    }
  }, [toast]);

  const getSignedUrl = useCallback(async (agentId: string, context?: any): Promise<SignedUrlResponse> => {
    try {
      logger.debug('Requesting signed URL', { agentId }, 'VoiceAgentConnection');
      
      const { data, error } = await supabase.functions.invoke('elevenlabs-agent', {
        body: { agentId, ...context }
      });

      if (error) {
        logger.error('Supabase function error', error, 'VoiceAgentConnection');
        throw new Error(error.message || `Supabase function error: ${JSON.stringify(error)}`);
      }

      if (!data?.success || !data?.signedUrl) {
        throw new Error(data?.error || 'No signed URL received from edge function');
      }

      return data as SignedUrlResponse;
    } catch (error) {
      logger.error('Failed to get signed URL', error, 'VoiceAgentConnection');
      throw error;
    }
  }, []);

  const connect = useCallback(async (agentId: string, context?: any): Promise<void> => {
    try {
      setIsConnecting(true);

      // Check browser compatibility first
      const browserCheck = checkBrowserCompatibility();
      if (!browserCheck.isSupported) {
        throw new Error(`BROWSER_NOT_COMPATIBLE: ${browserCheck.warningMessage}`);
      }

      // Request microphone access
      const hasAccess = await requestMicrophoneAccess();
      if (!hasAccess) {
        setIsConnecting(false);
        return;
      }

      // Get signed URL
      const urlResponse = await getSignedUrl(agentId, context);

      // Start conversation
      logger.info('Starting conversation', { agentId }, 'VoiceAgentConnection');
      const conversationId = await conversation.startSession({
        signedUrl: urlResponse.signedUrl!
      });
      logger.info('Conversation started', { conversationId }, 'VoiceAgentConnection');

    } catch (error) {
      logger.error('Failed to connect', error, 'VoiceAgentConnection');
      setIsConnecting(false);
      
      const parsedError = parseVoiceAgentError(error);
      
      // Enhanced error message with recovery steps
      let description = getUserFriendlyErrorMessage(parsedError);
      if (parsedError.recoverySteps && parsedError.recoverySteps.length > 0) {
        description += '\n\nTry these steps:\n' + 
          parsedError.recoverySteps.map((step, i) => `${i + 1}. ${step}`).join('\n');
      }

      toast({
        title: getErrorTitle(parsedError),
        description,
        variant: 'destructive'
      });
      
      throw error;
    }
  }, [conversation, requestMicrophoneAccess, getSignedUrl, toast]);

  const disconnect = useCallback(async (): Promise<void> => {
    try {
      await conversation.endSession();
    } catch (error) {
      logger.error('Failed to disconnect', error, 'VoiceAgentConnection');
      throw error;
    }
  }, [conversation]);

  return {
    isConnected,
    isConnecting,
    isSpeaking: conversation.isSpeaking,
    connect,
    disconnect,
    conversation
  };
}
