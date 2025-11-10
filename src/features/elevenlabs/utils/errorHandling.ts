/**
 * ElevenLabs Error Handling Utilities
 * Centralized error parsing and user-friendly message generation
 */

import { VoiceAgentError } from '../types';

export function parseVoiceAgentError(error: any): VoiceAgentError {
  const errorString = error?.message || error?.toString() || 'Unknown error';

  // AudioWorklet errors (check first - most specific)
  if (errorString.includes('audioConcatProcessor') || 
      errorString.includes('AudioWorklet') ||
      errorString.includes('worklet') ||
      errorString.includes('registerProcessor')) {
    return {
      code: 'AUDIOWORKLET_NOT_SUPPORTED',
      message: 'Your browser doesn\'t support audio processing features required for voice chat. Please use the latest version of Chrome, Firefox, or Edge.',
      originalError: error,
      recoverySteps: [
        'Update your browser to the latest version',
        'Try using Chrome 120+ or Firefox 120+ (recommended)',
        'Disable browser extensions that may block audio',
        'Ensure you\'re using HTTPS (not HTTP)',
        'Check if your network has content security policies blocking audio'
      ]
    };
  }

  // Browser compatibility errors
  if (errorString.includes('BROWSER_NOT_COMPATIBLE')) {
    return {
      code: 'BROWSER_NOT_COMPATIBLE',
      message: errorString.replace('BROWSER_NOT_COMPATIBLE: ', ''),
      originalError: error,
      recoverySteps: [
        'Update your browser to the latest version',
        'Switch to Chrome 66+, Firefox 76+, Edge 79+, or Safari 14.1+',
        'Disable browser extensions temporarily',
        'Try using a different device if available'
      ]
    };
  }

  // Microphone access errors
  if (errorString.includes('getUserMedia') || errorString.includes('NotAllowedError')) {
    return {
      code: 'MICROPHONE_ACCESS_DENIED',
      message: 'Microphone access is required. Please allow microphone permissions in your browser settings.',
      originalError: error,
      recoverySteps: [
        'Click the microphone icon in your browser\'s address bar',
        'Select "Always allow" for microphone access',
        'Refresh the page and try again',
        'Check your system settings to ensure microphone is not blocked'
      ]
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
    case 'AUDIOWORKLET_NOT_SUPPORTED':
      return 'Browser Audio Not Supported';
    case 'BROWSER_NOT_COMPATIBLE':
      return 'Incompatible Browser';
    default:
      return 'Voice Agent Error';
  }
}
