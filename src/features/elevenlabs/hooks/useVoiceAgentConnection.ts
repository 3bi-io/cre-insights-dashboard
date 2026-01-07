/**
 * Voice Agent Connection Hook
 * Manages connection state and lifecycle for ElevenLabs voice agents
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useConversation } from '@11labs/react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { parseVoiceAgentError, getErrorTitle, getUserFriendlyErrorMessage } from '../utils/errorHandling';
import { checkBrowserCompatibility } from '../utils/browserCompatibility';
import { SignedUrlResponse, LiveTranscriptMessage } from '../types';

interface UseVoiceAgentConnectionOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
  onTranscript?: (message: LiveTranscriptMessage) => void;
  agentOverrides?: any;
}

export function useVoiceAgentConnection(options: UseVoiceAgentConnectionOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcripts, setTranscripts] = useState<LiveTranscriptMessage[]>([]);
  const [pendingUserTranscript, setPendingUserTranscript] = useState<string>('');
  const { toast } = useToast();
  
  // Ref to track connection state for cleanup (avoids stale closure issues)
  const isConnectedRef = useRef(false);
  
  // Keep ref in sync with state
  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);

  const clearTranscripts = useCallback(() => {
    setTranscripts([]);
    setPendingUserTranscript('');
  }, []);

  const conversation = useConversation({
    overrides: options.agentOverrides,
    onConnect: () => {
      logger.info('Voice agent connected', undefined, 'VoiceAgentConnection');
      setIsConnected(true);
      setIsConnecting(false);
      clearTranscripts();
      options.onConnect?.();
    },
    onDisconnect: () => {
      logger.info('Voice agent disconnected', undefined, 'VoiceAgentConnection');
      setIsConnected(false);
      setIsConnecting(false);
      options.onDisconnect?.();
    },
    onMessage: (message: any) => {
      logger.debug('Voice agent message', { message }, 'VoiceAgentConnection');
      
      // Handle user transcriptions
      if (message.type === 'user_transcript') {
        const transcript = message.user_transcription_event;
        if (transcript?.is_final) {
          const newMessage: LiveTranscriptMessage = {
            id: crypto.randomUUID(),
            speaker: 'user',
            text: transcript.user_transcript,
            timestamp: new Date(),
            isFinal: true
          };
          setTranscripts(prev => [...prev, newMessage]);
          setPendingUserTranscript('');
          options.onTranscript?.(newMessage);
        } else if (transcript?.user_transcript) {
          setPendingUserTranscript(transcript.user_transcript);
        }
      }
      
      // Handle agent responses
      if (message.type === 'agent_response') {
        const agentResponse = message.agent_response_event;
        if (agentResponse?.agent_response) {
          const newMessage: LiveTranscriptMessage = {
            id: crypto.randomUUID(),
            speaker: 'agent',
            text: agentResponse.agent_response,
            timestamp: new Date(),
            isFinal: true
          };
          setTranscripts(prev => [...prev, newMessage]);
          options.onTranscript?.(newMessage);
        }
      }

      // Handle agent response corrections (when user interrupts)
      if (message.type === 'agent_response_correction') {
        const correction = message.agent_response_correction_event;
        if (correction?.corrected_agent_response) {
          // Update the last agent message with corrected text
          setTranscripts(prev => {
            const updated = [...prev];
            // Find last agent message index
            let lastAgentIdx = -1;
            for (let i = updated.length - 1; i >= 0; i--) {
              if (updated[i].speaker === 'agent') {
                lastAgentIdx = i;
                break;
              }
            }
            if (lastAgentIdx >= 0) {
              updated[lastAgentIdx] = {
                ...updated[lastAgentIdx],
                text: correction.corrected_agent_response
              };
            }
            return updated;
          });
        }
      }
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

  // Cleanup on unmount - end session gracefully
  useEffect(() => {
    return () => {
      if (isConnectedRef.current) {
        logger.debug('Component unmounting, ending voice session', undefined, 'VoiceAgentConnection');
        conversation.endSession().catch(() => {
          // Silently handle cleanup errors - component is already unmounting
        });
      }
    };
  }, [conversation]);

  const disconnect = useCallback(async (): Promise<void> => {
    try {
      // Check if already disconnected to avoid WebSocket warnings
      if (conversation.status === 'disconnected') {
        logger.debug('Already disconnected, skipping', undefined, 'VoiceAgentConnection');
        return;
      }
      await conversation.endSession();
    } catch (error) {
      // Only log/throw if it's not an expected "already closed" error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('CLOSING') && !errorMessage.includes('CLOSED')) {
        logger.error('Failed to disconnect', error, 'VoiceAgentConnection');
        throw error;
      }
      logger.debug('WebSocket already closed during disconnect', undefined, 'VoiceAgentConnection');
    }
  }, [conversation]);

  return {
    isConnected,
    isConnecting,
    isSpeaking: conversation.isSpeaking,
    transcripts,
    pendingUserTranscript,
    clearTranscripts,
    connect,
    disconnect,
    conversation
  };
}
