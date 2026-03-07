/**
 * Sentry Error Tracking Integration
 * Captures and reports errors to Sentry for monitoring
 */

import * as Sentry from '@sentry/react';
import { logger } from '@/lib/logger';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const isProduction = import.meta.env.MODE === 'production';

/**
 * Initialize Sentry error tracking
 * Production-only error monitoring and performance tracking
 */
export const initSentry = () => {
  if (!SENTRY_DSN) {
    logger.info('Sentry not configured (missing VITE_SENTRY_DSN)');
    return;
  }

  if (!isProduction) {
    logger.info('Sentry requires production mode');
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: import.meta.env.MODE,
      
      // Performance Monitoring
      tracesSampleRate: 0.1, // 10% of transactions
      
      // Session Replay
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

      // Filter out known errors
      beforeSend(event, hint) {
        const error = hint.originalException;
        
        // Filter out noisy third-party errors
        if (error && typeof error === 'object' && 'message' in error) {
          const message = String(error.message);
          
          // Skip ingesteer errors (RUM/analytics blocked by ad blockers)
          if (message.includes('ingesteer.services-prod')) {
            return null;
          }
          
          // Skip ResizeObserver loop errors (benign Chrome bug)
          if (message.includes('ResizeObserver loop')) {
            return null;
          }
          
          // Skip script loading errors from extensions
          if (message.includes('Loading chunk') && message.includes('failed')) {
            return null;
          }
        }
        
        return event;
      },
    });

    logger.debug('Sentry initialized', { environment: import.meta.env.MODE });
  } catch (error) {
    logger.error('Failed to initialize Sentry', error);
  }
};

/**
 * Capture exception manually
 */
export const captureException = (error: Error, context?: Record<string, any>) => {
  if (!isProduction || !SENTRY_DSN) {
    return; // No Sentry in non-production — caller already logged to console
  }

  try {
    Sentry.captureException(error, { extra: context });
  } catch {
    // Silently fail — never call logger here to avoid recursion
  }
};

/**
 * Capture message
 */
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>) => {
  if (!isProduction || !SENTRY_DSN) {
    return; // No Sentry in non-production — caller already logged to console
  }

  try {
    Sentry.captureMessage(message, { level, extra: context });
  } catch {
    // Silently fail — never call logger here to avoid recursion
  }
};

/**
 * Add breadcrumb (navigation trail)
 */
export const addBreadcrumb = (breadcrumb: {
  message: string;
  category?: string;
  level?: Sentry.SeverityLevel;
  data?: Record<string, any>;
}) => {
  if (!isProduction || !SENTRY_DSN) return;

  Sentry.addBreadcrumb(breadcrumb);
};

/**
 * Set user context
 */
export const setUserContext = (user: {
  id: string;
  email?: string;
  username?: string;
  organizationId?: string;
  role?: string;
}) => {
  if (!isProduction || !SENTRY_DSN) return;

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });

  // Add organization context
  if (user.organizationId) {
    Sentry.setContext('organization', {
      id: user.organizationId,
      role: user.role,
    });
  }
};

/**
 * Clear user context (on logout)
 */
export const clearUserContext = () => {
  if (!isProduction || !SENTRY_DSN) return;

  Sentry.setUser(null);
};

/**
 * Set custom context
 */
export const setContext = (name: string, context: Record<string, any>) => {
  if (!isProduction || !SENTRY_DSN) return;

  Sentry.setContext(name, context);
};

/**
 * Set tag for filtering
 */
export const setTag = (key: string, value: string) => {
  if (!isProduction || !SENTRY_DSN) return;

  Sentry.setTag(key, value);
};
