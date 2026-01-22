/**
 * Analytics Hooks
 * 
 * Note: Some hooks have been consolidated into the platforms feature.
 * This module provides service-layer based hooks for analytics.
 */

// Service-based analytics hooks (use analytics service layer)
export { useSpendTrendData as useAnalyticsSpendTrend } from './useSpendTrendData';
export { usePlatformPerformanceData as useAnalyticsPlatformPerformance } from './usePlatformPerformanceData';
export { useMetaSpendAnalytics as useAnalyticsMetaSpend } from './useMetaSpendAnalytics';

// Unique analytics hooks
export { useMonthlyBudgetData } from './useMonthlyBudgetData';
export { useJobVolumeData } from './useJobVolumeData';
export { useCategoryBreakdown } from './useCategoryBreakdown';
export { useDashboardMetrics } from './useDashboardMetrics';
export { useApplyPageAnalytics } from './useApplyPageAnalytics';

// Re-export from platforms for convenience (these are the canonical versions)
export { 
  useSpendTrendData,
  usePlatformPerformanceData,
  useMetaSpendAnalytics 
} from '@/features/platforms/hooks';
