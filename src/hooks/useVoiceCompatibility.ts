/**
 * Voice Compatibility Detection Hook
 * Proactively checks if the device supports WebRTC voice features
 * to gracefully hide voice options on incompatible/older devices
 */

import { useState, useEffect, useMemo } from 'react';
import { checkBrowserCompatibility, getBrowserInfo } from '@/features/elevenlabs/utils/browserCompatibility';

export interface VoiceCompatibilityResult {
  isSupported: boolean;
  isChecking: boolean;
  reason: string | null;
  browserInfo: {
    name: string;
    version: string;
    isSupported: boolean;
  };
  featureSupport: {
    hasAudioWorklet: boolean;
    hasAudioContext: boolean;
    hasMediaDevices: boolean;
    hasSecureContext: boolean;
  };
  recommendation: string | null;
}

/**
 * Hook to check if voice features are supported on the current device
 * Use this to conditionally show/hide voice application buttons
 */
export function useVoiceCompatibility(): VoiceCompatibilityResult {
  const [isChecking, setIsChecking] = useState(true);
  const [compatibilityResult, setCompatibilityResult] = useState<VoiceCompatibilityResult | null>(null);

  useEffect(() => {
    const checkCompatibility = () => {
      try {
        const browserCheck = checkBrowserCompatibility();
        const browserInfo = getBrowserInfo();
        
        // Additional checks for older devices
        const hasSecureContext = typeof window !== 'undefined' && window.isSecureContext;
        
        let reason: string | null = null;
        let recommendation: string | null = null;
        
        if (!browserCheck.isSupported) {
          reason = browserCheck.warningMessage || 'Your device does not support voice features';
          
          // Provide specific recommendations based on what's missing
          if (!browserCheck.hasAudioWorklet) {
            recommendation = 'Voice features require a modern browser. Please update your browser or use Chrome, Firefox, or Edge.';
          } else if (!browserCheck.hasMediaDevices) {
            recommendation = 'Your device does not support microphone access. Please use the text application form instead.';
          } else if (!browserCheck.hasAudioContext) {
            recommendation = 'Audio processing is not available on your device. Please use a newer browser.';
          } else if (!browserInfo.isSupported) {
            recommendation = `Please update ${browserInfo.name} to a newer version for voice features.`;
          }
        }
        
        if (!hasSecureContext) {
          reason = 'Voice features require a secure connection (HTTPS)';
          recommendation = 'Please access this site over HTTPS to use voice features.';
        }

        const result: VoiceCompatibilityResult = {
          isSupported: browserCheck.isSupported && hasSecureContext,
          isChecking: false,
          reason,
          browserInfo,
          featureSupport: {
            hasAudioWorklet: browserCheck.hasAudioWorklet,
            hasAudioContext: browserCheck.hasAudioContext,
            hasMediaDevices: browserCheck.hasMediaDevices,
            hasSecureContext
          },
          recommendation
        };
        
        setCompatibilityResult(result);
      } catch (error) {
        // If check fails, assume not supported (safer for older devices)
        setCompatibilityResult({
          isSupported: false,
          isChecking: false,
          reason: 'Unable to check voice compatibility',
          browserInfo: { name: 'Unknown', version: '0', isSupported: false },
          featureSupport: {
            hasAudioWorklet: false,
            hasAudioContext: false,
            hasMediaDevices: false,
            hasSecureContext: false
          },
          recommendation: 'Please use the standard application form instead.'
        });
      } finally {
        setIsChecking(false);
      }
    };

    // Small delay to avoid blocking initial render
    const timer = setTimeout(checkCompatibility, 100);
    return () => clearTimeout(timer);
  }, []);

  return useMemo(() => compatibilityResult || {
    isSupported: false,
    isChecking: true,
    reason: null,
    browserInfo: { name: 'Unknown', version: '0', isSupported: false },
    featureSupport: {
      hasAudioWorklet: false,
      hasAudioContext: false,
      hasMediaDevices: false,
      hasSecureContext: false
    },
    recommendation: null
  }, [compatibilityResult]);
}

/**
 * Simple boolean check for voice support
 * Use this for quick conditional rendering
 */
export function useIsVoiceSupported(): boolean {
  const { isSupported, isChecking } = useVoiceCompatibility();
  // While checking, return false to avoid flash of voice button on unsupported devices
  return !isChecking && isSupported;
}
