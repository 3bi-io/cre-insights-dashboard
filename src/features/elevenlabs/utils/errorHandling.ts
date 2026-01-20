/**
 * ElevenLabs Error Handling Utilities
 * Centralized error parsing and user-friendly message generation
 */

import { VoiceAgentError } from '../types';

export function parseVoiceAgentError(error: any): VoiceAgentError {
  const errorString = error?.message || error?.toString() || 'Unknown error';

  // AudioWorklet errors (check first - most specific)
  // Common on older Android devices and older browsers
  if (errorString.includes('audioConcatProcessor') || 
      errorString.includes('AudioWorklet') ||
      errorString.includes('worklet') ||
      errorString.includes('registerProcessor')) {
    return {
      code: 'AUDIOWORKLET_NOT_SUPPORTED',
      message: 'Voice features are not available on this device. Your browser may be outdated or doesn\'t support the required audio features.',
      originalError: error,
      recoverySteps: [
        'Please use the "Apply Now" button to submit your application using the form',
        'If you want to use voice, try updating your browser to the latest version',
        'Chrome, Firefox, Edge, or Safari (iOS 14.1+) work best',
        'If on Android, make sure your WebView system component is updated'
      ]
    };
  }

  // Browser compatibility errors - friendly message for older devices
  if (errorString.includes('BROWSER_NOT_COMPATIBLE')) {
    return {
      code: 'BROWSER_NOT_COMPATIBLE',
      message: 'Voice application is not available on this device, but you can still apply using the form!',
      originalError: error,
      recoverySteps: [
        'Use the "Apply Now" button to fill out the application form instead',
        'Voice features require a newer browser with audio support',
        'If possible, try updating your browser or device software'
      ]
    };
  }

  // Microphone access errors - clearer instructions
  if (errorString.includes('getUserMedia') || 
      errorString.includes('NotAllowedError') ||
      errorString.includes('PermissionDeniedError')) {
    return {
      code: 'MICROPHONE_ACCESS_DENIED',
      message: 'Microphone access was denied. You can still apply using the form instead.',
      originalError: error,
      recoverySteps: [
        'To use voice application, allow microphone access when prompted',
        'Or simply use the "Apply Now" button to fill out the form',
        'Check your phone settings if microphone is blocked for this browser'
      ]
    };
  }

  // No microphone available (common on older devices or desktop without mic)
  if (errorString.includes('NotFoundError') || 
      errorString.includes('DevicesNotFoundError') ||
      errorString.includes('no audio input')) {
    return {
      code: 'MICROPHONE_ACCESS_DENIED',
      message: 'No microphone detected on this device. Please use the application form instead.',
      originalError: error,
      recoverySteps: [
        'Use the "Apply Now" button to complete your application',
        'Voice features require a working microphone',
        'If using a desktop, connect a microphone and refresh the page'
      ]
    };
  }

  // API key errors
  if (errorString.includes('API key') || errorString.includes('not configured')) {
    return {
      code: 'API_KEY_MISSING',
      message: 'Voice service is temporarily unavailable. Please use the form to apply.',
      originalError: error,
      recoverySteps: [
        'Click "Apply Now" to submit your application using the form',
        'Voice service will be restored soon'
      ]
    };
  }

  // Agent ID errors
  if (errorString.includes('Agent ID') || errorString.includes('agent_not_found')) {
    return {
      code: 'INVALID_AGENT_ID',
      message: 'Voice agent is not available for this job. Please use the application form.',
      originalError: error,
      recoverySteps: [
        'Use the "Apply Now" button to submit your application'
      ]
    };
  }

  // Connection/network errors - common on slow connections
  if (errorString.includes('Connection') || 
      errorString.includes('network') ||
      errorString.includes('timeout') ||
      errorString.includes('Failed to fetch')) {
    return {
      code: 'CONNECTION_FAILED',
      message: 'Connection failed. This may be due to a slow internet connection.',
      originalError: error,
      recoverySteps: [
        'Check your internet connection and try again',
        'If the problem persists, use the "Apply Now" button instead',
        'Voice calls require a stable internet connection'
      ]
    };
  }

  // WebRTC not supported (very old browsers)
  if (errorString.includes('RTCPeerConnection') || 
      errorString.includes('webrtc') ||
      errorString.includes('WebRTC')) {
    return {
      code: 'BROWSER_NOT_COMPATIBLE',
      message: 'Voice calling is not supported on this device. Please use the application form.',
      originalError: error,
      recoverySteps: [
        'Use the "Apply Now" button to complete your application',
        'Voice features require a browser with video calling support',
        'Try using a newer browser like Chrome, Firefox, or Safari'
      ]
    };
  }

  // Default error - always provide a fallback option
  return {
    code: 'UNKNOWN',
    message: 'Voice application encountered an issue. You can still apply using the form!',
    originalError: error,
    recoverySteps: [
      'Click "Apply Now" to submit your application using the form',
      'If you want to try voice again, refresh the page and try once more'
    ]
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
