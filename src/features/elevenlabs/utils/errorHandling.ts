/**
 * ElevenLabs Error Handling Utilities
 * Centralized error parsing and user-friendly message generation
 */

import { VoiceAgentError } from '../types';

export function parseVoiceAgentError(error: any): VoiceAgentError {
  const errorString = error?.message || error?.toString() || 'Unknown error';

  // Microphone access errors
  if (errorString.includes('getUserMedia') || errorString.includes('NotAllowedError')) {
    return {
      code: 'MICROPHONE_ACCESS_DENIED',
      message: 'Microphone access is required. Please allow microphone permissions in your browser settings.',
      originalError: error
    };
  }

  // API key errors
  if (errorString.includes('API key') || errorString.includes('not configured')) {
    return {
      code: 'API_KEY_MISSING',
      message: 'ElevenLabs API key not configured properly. Please contact your administrator.',
      originalError: error
    };
  }

  // Agent ID errors
  if (errorString.includes('Agent ID') || errorString.includes('agent_not_found')) {
    return {
      code: 'INVALID_AGENT_ID',
      message: 'Invalid Agent ID. Please verify the ElevenLabs Agent ID is correct.',
      originalError: error
    };
  }

  // Connection errors
  if (errorString.includes('Connection') || errorString.includes('network')) {
    return {
      code: 'CONNECTION_FAILED',
      message: 'Failed to connect to voice agent. Please check your internet connection and try again.',
      originalError: error
    };
  }

  // Default error
  return {
    code: 'UNKNOWN',
    message: `Failed to start voice agent: ${errorString}`,
    originalError: error
  };
}

export function getUserFriendlyErrorMessage(error: VoiceAgentError): string {
  return error.message;
}

export function getErrorTitle(error: VoiceAgentError): string {
  switch (error.code) {
    case 'MICROPHONE_ACCESS_DENIED':
      return 'Microphone Access Required';
    case 'API_KEY_MISSING':
      return 'Configuration Error';
    case 'INVALID_AGENT_ID':
      return 'Invalid Agent';
    case 'CONNECTION_FAILED':
      return 'Connection Failed';
    default:
      return 'Voice Agent Error';
  }
}
