/**
 * Core Web Vitals Monitoring
 * Tracks LCP, CLS, FID, FCP, TTFB and reports to GA4
 */

import { onCLS, onFID, onLCP, onFCP, onTTFB } from 'web-vitals';
import type { Metric } from 'web-vitals';
import { trackTiming } from '@/utils/analytics';
import { logger } from '@/lib/logger';

/**
 * Report a web vital metric to GA4
 */
function reportMetric(metric: Metric) {
  const { name, value, rating } = metric;

  // Send to GA4 via existing timing tracker
  trackTiming('Web Vitals', name, Math.round(name === 'CLS' ? value * 1000 : value));

  // Log with rating for dev visibility
  logger.debug(`[Web Vitals] ${name}: ${value.toFixed(name === 'CLS' ? 4 : 0)} (${rating})`, {
    context: 'WEB_VITALS',
    id: metric.id,
    navigationType: metric.navigationType,
  });
}

/**
 * Initialize Core Web Vitals tracking
 * Call once in the app entry point
 */
export function initWebVitals() {
  try {
    onCLS(reportMetric);
    onFID(reportMetric);
    onLCP(reportMetric);
    onFCP(reportMetric);
    onTTFB(reportMetric);
    logger.debug('Core Web Vitals monitoring initialized', { context: 'WEB_VITALS' });
  } catch (error) {
    logger.error('Failed to initialize Web Vitals', error, { context: 'WEB_VITALS' });
  }
}
