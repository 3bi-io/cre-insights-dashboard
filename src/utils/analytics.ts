/**
 * Google Analytics Integration
 * Track user behavior and application usage
 */

import ReactGA from 'react-ga4';
import { logger } from '@/lib/logger';

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
const isProduction = import.meta.env.MODE === 'production';

/**
 * Initialize Google Analytics
 * Only runs in production if measurement ID is configured
 */
export const initAnalytics = () => {
  if (!MEASUREMENT_ID) {
    logger.debug('Google Analytics not configured (missing VITE_GA_MEASUREMENT_ID)');
    return;
  }

  if (!isProduction) {
    logger.info('Google Analytics requires production mode');
    return;
  }

  try {
    ReactGA.initialize(MEASUREMENT_ID, {
      gaOptions: {
        siteSpeedSampleRate: 100,
      },
    });
    logger.debug('Google Analytics initialized', { measurementId: MEASUREMENT_ID });
  } catch (error) {
    logger.error('Failed to initialize Google Analytics', error);
  }
};

/**
 * Track page view
 */
export const trackPageView = (path: string, title?: string) => {
  if (!isProduction || !MEASUREMENT_ID) return;

  try {
    ReactGA.send({
      hitType: 'pageview',
      page: path,
      title: title || document.title,
    });
    logger.debug('Page view tracked', { path, title });
  } catch (error) {
    logger.error('Failed to track page view', error);
  }
};

/**
 * Track custom event
 */
export const trackEvent = (
  category: string,
  action: string,
  label?: string,
  value?: number
) => {
  if (!isProduction || !MEASUREMENT_ID) return;

  try {
    ReactGA.event({
      category,
      action,
      label,
      value,
    });
    logger.debug('Event tracked', { category, action, label, value });
  } catch (error) {
    logger.error('Failed to track event', error);
  }
};

/**
 * Track user timing (performance metrics)
 */
export const trackTiming = (
  category: string,
  variable: string,
  value: number,
  label?: string
) => {
  if (!isProduction || !MEASUREMENT_ID) return;

  try {
    ReactGA.event({
      category: 'timing',
      action: category,
      label: `${variable}${label ? ` - ${label}` : ''}`,
      value: Math.round(value),
    });
    logger.debug('Timing tracked', { category, variable, value, label });
  } catch (error) {
    logger.error('Failed to track timing', error);
  }
};

/**
 * Track user authentication
 */
export const trackAuth = (action: 'login' | 'logout' | 'signup', method?: string) => {
  trackEvent('Authentication', action, method);
};

/**
 * Track application errors
 */
export const trackError = (error: Error, fatal: boolean = false) => {
  if (!isProduction || !MEASUREMENT_ID) return;

  try {
    ReactGA.event({
      category: 'Error',
      action: error.name,
      label: error.message,
      nonInteraction: true,
    });

    if (fatal) {
      ReactGA.event({
        category: 'Error',
        action: 'Fatal Error',
        label: error.message,
        nonInteraction: true,
      });
    }
  } catch (err) {
    logger.error('Failed to track error', err);
  }
};

/**
 * Track user actions
 */
export const trackUserAction = (action: string, category: string = 'User Action', label?: string) => {
  trackEvent(category, action, label);
};

/**
 * Track feature usage
 */
export const trackFeature = (featureName: string, action: string = 'used') => {
  trackEvent('Feature', action, featureName);
};

/**
 * Track search queries
 */
export const trackSearch = (query: string, resultCount?: number) => {
  trackEvent('Search', 'query', query, resultCount);
};

/**
 * Track conversion events
 */
export const trackConversion = (type: string, value?: number) => {
  trackEvent('Conversion', type, undefined, value);
};

/**
 * Set user ID for cross-device tracking
 */
export const setUserId = (userId: string) => {
  if (!isProduction || !MEASUREMENT_ID) return;

  try {
    ReactGA.set({ userId });
    logger.debug('User ID set', { userId });
  } catch (error) {
    logger.error('Failed to set user ID', error);
  }
};

/**
 * Set user properties
 */
export const setUserProperties = (properties: Record<string, any>) => {
  if (!isProduction || !MEASUREMENT_ID) return;

  try {
    ReactGA.set(properties);
    logger.debug('User properties set', properties);
  } catch (error) {
    logger.error('Failed to set user properties', error);
  }
};
