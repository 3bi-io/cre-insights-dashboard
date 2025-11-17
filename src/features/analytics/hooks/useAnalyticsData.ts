/**
 * Consolidated Analytics Data Hook
 * Replaces multiple individual analytics hooks with a single parameterized hook
 */

import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services';
import { useAuth } from '@/hooks/useAuth';
import type {
  SpendTrendData,
  PlatformPerformanceData,
  MonthlyBudgetData,
  JobVolumeData,
  CategoryData,
  AnalyticsDashboardMetrics,
} from '../types';

export type AnalyticsDataType =
  | 'spendTrend'
  | 'platformPerformance'
  | 'monthlyBudget'
  | 'jobVolume'
  | 'categoryBreakdown'
  | 'dashboardMetrics';

type AnalyticsDataTypeMap = {
  spendTrend: SpendTrendData[];
  platformPerformance: PlatformPerformanceData[];
  monthlyBudget: MonthlyBudgetData[];
  jobVolume: JobVolumeData[];
  categoryBreakdown: CategoryData[];
  dashboardMetrics: AnalyticsDashboardMetrics;
};

interface UseAnalyticsDataOptions {
  enabled?: boolean;
  staleTime?: number;
}

/**
 * Generic analytics data hook
 * @param dataType Type of analytics data to fetch
 * @param options Query options
 * @returns Query result with typed data
 */
export function useAnalyticsData<T extends AnalyticsDataType>(
  dataType: T,
  options?: UseAnalyticsDataOptions
) {
  const { organization } = useAuth();

  const queryFnMap: Record<AnalyticsDataType, () => Promise<unknown>> = {
    spendTrend: () => analyticsService.getSpendTrendData(organization?.id),
    platformPerformance: () => analyticsService.getPlatformPerformanceData(organization?.id),
    monthlyBudget: () => analyticsService.getMonthlyBudgetData(organization?.id),
    jobVolume: () => analyticsService.getJobVolumeData(organization?.id),
    categoryBreakdown: () => analyticsService.getCategoryBreakdown(organization?.id),
    dashboardMetrics: () => analyticsService.getDashboardMetrics(organization?.id),
  };

  return useQuery<AnalyticsDataTypeMap[T], Error>({
    queryKey: [dataType, organization?.id],
    queryFn: queryFnMap[dataType] as () => Promise<AnalyticsDataTypeMap[T]>,
    staleTime: options?.staleTime ?? 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
  });
}

// Convenience hooks for backward compatibility
export const useSpendTrendData = () => useAnalyticsData('spendTrend');
export const usePlatformPerformanceData = () => useAnalyticsData('platformPerformance');
export const useMonthlyBudgetData = () => useAnalyticsData('monthlyBudget');
export const useJobVolumeData = () => useAnalyticsData('jobVolume');
export const useCategoryBreakdown = () => useAnalyticsData('categoryBreakdown');
export const useDashboardMetrics = () => useAnalyticsData('dashboardMetrics');
