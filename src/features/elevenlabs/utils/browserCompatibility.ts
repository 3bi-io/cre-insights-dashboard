/**
 * Browser Compatibility Detection for ElevenLabs Voice Agent
 * Checks for AudioWorklet, AudioContext, and MediaDevices support
 */

export interface BrowserInfo {
  name: string;
  version: string;
  isSupported: boolean;
}

export interface CompatibilityCheck {
  isSupported: boolean;
  hasAudioWorklet: boolean;
  hasAudioContext: boolean;
  hasMediaDevices: boolean;
  browserInfo: BrowserInfo;
  warningMessage: string | null;
}

export const SUPPORTED_BROWSERS = [
  { name: 'Chrome', minVersion: 66 },
  { name: 'Firefox', minVersion: 76 },
  { name: 'Edge', minVersion: 79 },
  { name: 'Safari', minVersion: 14.1 },
  { name: 'Opera', minVersion: 53 },
];

/**
 * Check if browser supports AudioWorklet
 */
export function checkAudioWorkletSupport(): boolean {
  return typeof window !== 'undefined' && 'AudioWorklet' in window;
}

/**
 * Check if browser supports AudioContext
 */
export function checkAudioContextSupport(): boolean {
  return typeof window !== 'undefined' && 
    ('AudioContext' in window || 'webkitAudioContext' in window);
}

/**
 * Check if browser supports MediaDevices (microphone access)
 */
export function checkMediaDevicesSupport(): boolean {
  return typeof navigator !== 'undefined' && 
    !!navigator.mediaDevices && 
    !!navigator.mediaDevices.getUserMedia;
}

/**
 * Detect browser name and version
 */
export function getBrowserInfo(): BrowserInfo {
  if (typeof navigator === 'undefined') {
    return { name: 'Unknown', version: '0', isSupported: false };
  }

  const userAgent = navigator.userAgent;
  let browserName = 'Unknown';
  let browserVersion = '0';

  // Chrome
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browserName = 'Chrome';
    const match = userAgent.match(/Chrome\/(\d+)/);
    browserVersion = match ? match[1] : '0';
  }
  // Edge
  else if (userAgent.includes('Edg')) {
    browserName = 'Edge';
    const match = userAgent.match(/Edg\/(\d+)/);
    browserVersion = match ? match[1] : '0';
  }
  // Firefox
  else if (userAgent.includes('Firefox')) {
    browserName = 'Firefox';
    const match = userAgent.match(/Firefox\/(\d+)/);
    browserVersion = match ? match[1] : '0';
  }
  // Safari
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browserName = 'Safari';
    const match = userAgent.match(/Version\/(\d+)/);
    browserVersion = match ? match[1] : '0';
  }
  // Opera
  else if (userAgent.includes('OPR')) {
    browserName = 'Opera';
    const match = userAgent.match(/OPR\/(\d+)/);
    browserVersion = match ? match[1] : '0';
  }

  // Check if browser meets minimum version requirements
  const supportedBrowser = SUPPORTED_BROWSERS.find(b => b.name === browserName);
  const versionNumber = parseInt(browserVersion, 10);
  const isSupported = supportedBrowser ? versionNumber >= supportedBrowser.minVersion : false;

  return {
    name: browserName,
    version: browserVersion,
    isSupported
  };
}

/**
 * Comprehensive browser compatibility check
 */
export function checkBrowserCompatibility(): CompatibilityCheck {
  const hasAudioWorklet = checkAudioWorkletSupport();
  const hasAudioContext = checkAudioContextSupport();
  const hasMediaDevices = checkMediaDevicesSupport();
  const browserInfo = getBrowserInfo();

  const isSupported = hasAudioWorklet && hasAudioContext && hasMediaDevices;

  let warningMessage: string | null = null;

  if (!isSupported) {
    const missingFeatures: string[] = [];
    if (!hasAudioWorklet) missingFeatures.push('AudioWorklet');
    if (!hasAudioContext) missingFeatures.push('AudioContext');
    if (!hasMediaDevices) missingFeatures.push('microphone access');

    if (browserInfo.name === 'Unknown') {
      warningMessage = 'Your browser is not recognized. Voice chat requires a modern browser with audio processing capabilities.';
    } else if (!browserInfo.isSupported) {
      const supportedBrowser = SUPPORTED_BROWSERS.find(b => b.name === browserInfo.name);
      if (supportedBrowser) {
        warningMessage = `Your ${browserInfo.name} version (${browserInfo.version}) is outdated. Please update to version ${supportedBrowser.minVersion} or later.`;
      } else {
        warningMessage = `${browserInfo.name} is not fully supported for voice chat.`;
      }
    } else {
      warningMessage = `Your browser is missing required features: ${missingFeatures.join(', ')}. Please try a different browser or update to the latest version.`;
    }
  }

  return {
    isSupported,
    hasAudioWorklet,
    hasAudioContext,
    hasMediaDevices,
    browserInfo,
    warningMessage
  };
}

/**
 * Get browser warning message (null if compatible)
 */
export function getBrowserWarningMessage(): string | null {
  const check = checkBrowserCompatibility();
  return check.warningMessage;
}

/**
 * Check if current browser is compatible (simple boolean check)
 */
export function isCompatibleBrowser(): boolean {
  return checkBrowserCompatibility().isSupported;
}
