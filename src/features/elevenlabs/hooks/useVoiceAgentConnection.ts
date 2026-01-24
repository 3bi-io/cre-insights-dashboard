/**
 * Voice Agent Connection Hook
 * Manages WebRTC connection state and lifecycle for ElevenLabs voice agents
 * Optimized for fast, reliable connections with progress feedback and retry logic
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useConversation } from '@11labs/react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { parseVoiceAgentError, getErrorTitle, getUserFriendlyErrorMessage } from '../utils/errorHandling';
import { checkBrowserCompatibility } from '../utils/browserCompatibility';
import { SignedUrlResponse, LiveTranscriptMessage, ConnectionProgress } from '../types';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;
const CONNECTION_TIMEOUT_MS = 15000;

interface UseVoiceAgentConnectionOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
  onTranscript?: (message: LiveTranscriptMessage) => void;
}

function isRetryableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  
  // Never retry on permanent configuration errors
  if (message.includes('404') || 
      message.includes('403') || 
      message.includes('not found') ||
      message.includes('not configured') ||
      message.includes('Access denied') ||
      message.includes('agent_not_found')) {
    return false;
  }
  
  // Retry on network errors, timeouts, and temporary server errors
  return (
    message.includes('timeout') ||
    message.includes('network') ||
    message.includes('502') ||
    message.includes('503') ||
    message.includes('504') ||
    message.includes('fetch')
  );
}

export function useVoiceAgentConnection(options: UseVoiceAgentConnectionOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionProgress, setConnectionProgress] = useState<ConnectionProgress>('idle');
  const [transcripts, setTranscripts] = useState<LiveTranscriptMessage[]>([]);
  const [pendingUserTranscript, setPendingUserTranscript] = useState<string>('');
  const [pendingAgentTranscript, setPendingAgentTranscript] = useState<string>('');
  const { toast } = useToast();
  
  // Refs to track state for cleanup (avoids stale closure issues)
  const isConnectedRef = useRef(false);
  const conversationRef = useRef<ReturnType<typeof useConversation> | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isAttemptingConnectionRef = useRef(false);
  
  // Keep refs in sync with state
  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);

  const clearTranscripts = useCallback(() => {
    setTranscripts([]);
    setPendingUserTranscript('');
    setPendingAgentTranscript('');
  }, []);

  // Initialize conversation without overrides - prompts managed in ElevenLabs Dashboard
  const conversation = useConversation({
    onConnect: () => {
      logger.info('Voice agent connected via WebRTC', undefined, 'VoiceAgentConnection');
      
      // Clear connection timeout
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      
      setIsConnected(true);
      setIsConnecting(false);
      setConnectionProgress('connected');
      clearTranscripts();
      options.onConnect?.();
    },
    onDisconnect: () => {
      logger.info('Voice agent disconnected', undefined, 'VoiceAgentConnection');
      setIsConnected(false);
      setIsConnecting(false);
      setConnectionProgress('idle');
      options.onDisconnect?.();
    },
    onMessage: (message: any) => {
      logger.debug('Voice agent message', { type: message.type }, 'VoiceAgentConnection');
      
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
      
      // Handle interim/streaming agent responses
      if (message.type === 'interim_agent_response' || message.type === 'agent_transcript') {
        const interimText = message.interim_agent_response_event?.interim_agent_response 
          || message.agent_transcript_event?.agent_transcript
          || '';
        if (interimText) {
          setPendingAgentTranscript(interimText);
        }
      }

      // Handle final agent responses
      if (message.type === 'agent_response') {
        const agentResponse = message.agent_response_event;
        if (agentResponse?.agent_response) {
          setPendingAgentTranscript('');
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
          setTranscripts(prev => {
            const updated = [...prev];
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
      setConnectionProgress('idle');
      
      // Clear connection timeout
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      
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

  const getSignedUrl = useCallback(async (agentId: string | null, context?: any): Promise<SignedUrlResponse> => {
    try {
      const useGlobalAgent = context?.useGlobalAgent || false;
      logger.debug('Requesting signed URL', { agentId, useGlobalAgent }, 'VoiceAgentConnection');
      
      const { data, error } = await supabase.functions.invoke('elevenlabs-agent', {
        body: { agentId, useGlobalAgent }
      });

      if (error) {
        logger.error('Supabase function error', error, 'VoiceAgentConnection');
        throw new Error(error.message || `Supabase function error: ${JSON.stringify(error)}`);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to get signed URL');
      }

      // Handle both new format (data.data.signedUrl) and legacy format (data.signedUrl)
      const signedUrl = data?.data?.signedUrl || data?.signedUrl;

      if (!signedUrl) {
        throw new Error('No signed URL received from edge function');
      }

      return {
        success: true,
        data: { signedUrl }
      };
    } catch (error) {
      logger.error('Failed to get signed URL', error, 'VoiceAgentConnection');
      throw error;
    }
  }, []);

  const connect = useCallback(async (agentId: string | null, context?: any): Promise<void> => {
    // Prevent multiple simultaneous connection attempts
    if (isAttemptingConnectionRef.current) {
      logger.warn('Connection already in progress, ignoring duplicate request', undefined, 'VoiceAgentConnection');
      return;
    }
    isAttemptingConnectionRef.current = true;
    
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
      try {
        setIsConnecting(true);
        setConnectionProgress('idle');

        // Check browser compatibility first
        const browserCheck = checkBrowserCompatibility();
        if (!browserCheck.isSupported) {
          throw new Error(`BROWSER_NOT_COMPATIBLE: ${browserCheck.warningMessage}`);
        }

        // Step 1: Request microphone access
        setConnectionProgress('requesting-mic');
        const hasAccess = await requestMicrophoneAccess();
        if (!hasAccess) {
          setIsConnecting(false);
          setConnectionProgress('idle');
          return;
        }

        // Step 2: Get signed URL
        setConnectionProgress('fetching-token');
        const urlResponse = await getSignedUrl(agentId, context);

        // Build dynamic variables from job context
        const dynamicVariables: Record<string, string> = {
          job_title: context?.jobContext?.jobTitle || 'the driving position',
          company_name: context?.jobContext?.company || 'our company',
          candidate_name: context?.jobContext?.candidateName || 'there',
          job_description: context?.jobContext?.jobDescription || 'Details will be provided by the hiring team.',
          job_requirements: context?.jobContext?.requirements || 'specific qualifications for this role',
          job_benefits: context?.jobContext?.benefits || 'competitive benefits package',
          job_location: context?.jobContext?.location || 'various locations',
          salary_range: context?.jobContext?.salary || 'competitive salary'
        };

        // Step 3: Start WebRTC connection
        setConnectionProgress('connecting');
        
        // Set connection timeout
        connectionTimeoutRef.current = setTimeout(() => {
          logger.warn('Connection timeout after 15s', { agentId, attempt }, 'VoiceAgentConnection');
          setIsConnecting(false);
          setConnectionProgress('idle');
          toast({
            title: 'Connection Timeout',
            description: 'The voice agent took too long to respond. Please try again.',
            variant: 'destructive'
          });
        }, CONNECTION_TIMEOUT_MS);

        logger.info('Starting conversation', { agentId, attempt, dynamicVariables }, 'VoiceAgentConnection');
        
        // Use signedUrl from edge function
        if (urlResponse.data?.signedUrl) {
          await conversation.startSession({
            signedUrl: urlResponse.data.signedUrl,
            dynamicVariables
          });
        } else {
          // Direct agentId connection for public agents
          await conversation.startSession({
            agentId,
            dynamicVariables
          });
        }

        logger.info('Conversation session started', { agentId, attempt }, 'VoiceAgentConnection');
        isAttemptingConnectionRef.current = false;
        return; // Success - exit retry loop

      } catch (error) {
        lastError = error as Error;
        
        // Clear timeout on error
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }

        if (attempt <= MAX_RETRIES && isRetryableError(error)) {
          logger.warn(`Connection attempt ${attempt} failed, retrying...`, { error: lastError.message }, 'VoiceAgentConnection');
          await new Promise(r => setTimeout(r, RETRY_DELAY_MS * attempt));
          continue;
        }
        break;
      }
    }

    // All retries exhausted
    isAttemptingConnectionRef.current = false;
    logger.error('All connection attempts failed', lastError, 'VoiceAgentConnection');
    setIsConnecting(false);
    setConnectionProgress('idle');
    
    const parsedError = parseVoiceAgentError(lastError);
    
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
    
    throw lastError;
  }, [conversation, requestMicrophoneAccess, getSignedUrl, toast]);

  // Keep conversation ref in sync
  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      if (isConnectedRef.current && conversationRef.current) {
        logger.debug('Component unmounting, ending voice session', undefined, 'VoiceAgentConnection');
        conversationRef.current.endSession().catch(() => {
          // Silently handle cleanup errors
        });
      }
    };
  }, []);

  const disconnect = useCallback(async (): Promise<void> => {
    try {
      if (conversation.status === 'disconnected') {
        logger.debug('Already disconnected, skipping', undefined, 'VoiceAgentConnection');
        return;
      }
      await conversation.endSession();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('CLOSING') && !errorMessage.includes('CLOSED')) {
        logger.error('Failed to disconnect', error, 'VoiceAgentConnection');
        throw error;
      }
      logger.debug('WebSocket already closed during disconnect', undefined, 'VoiceAgentConnection');
    }
  }, [conversation]);

  const cancelConnection = useCallback(() => {
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    setIsConnecting(false);
    setConnectionProgress('idle');
    logger.info('Connection cancelled by user', undefined, 'VoiceAgentConnection');
  }, []);

  return {
    isConnected,
    isConnecting,
    connectionProgress,
    isSpeaking: conversation.isSpeaking,
    transcripts,
    pendingUserTranscript,
    pendingAgentTranscript,
    clearTranscripts,
    connect,
    disconnect,
    cancelConnection,
    conversation
  };
}
