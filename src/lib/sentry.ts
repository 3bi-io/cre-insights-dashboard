/**
 * Sentry Error Monitoring Configuration
 */

import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const ENVIRONMENT = import.meta.env.MODE;

export function initSentry() {
  // Only initialize if DSN is provided
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not configured. Error monitoring disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // Performance Monitoring
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
    
    // Session Replay
    replaysSessionSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
    
    // Filtering
    beforeSend(event, hint) {
      // Filter out development errors
      if (ENVIRONMENT === 'development') {
        console.error('Sentry Event:', event, hint);
      }
      
      // Filter sensitive data
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers?.['Authorization'];
      }
      
      return event;
    },
    
    // Ignore common errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'canvas.contentDocument',
      // Network errors
      'NetworkError',
      'Network request failed',
      // Random plugins
      'atomicFindClose',
      'fb_xd_fragment',
    ],
    
    denyUrls: [
      // Chrome extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
    ],
  });
}

// Capture exceptions manually
export function captureException(error: Error, context?: Record<string, any>) {
  if (ENVIRONMENT === 'development') {
    console.error('Exception captured:', error, context);
  }
  
  Sentry.captureException(error, {
    contexts: {
      custom: context,
    },
  });
}

// Capture messages
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

// Set user context
export function setUser(user: { id: string; email?: string; username?: string } | null) {
  Sentry.setUser(user);
}

// Add breadcrumb
export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
  Sentry.addBreadcrumb(breadcrumb);
}

// Performance monitoring
export function startSpan(options: { name: string; op: string }) {
  return Sentry.startInactiveSpan(options);
}

export { Sentry };
