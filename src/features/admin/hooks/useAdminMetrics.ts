import { useQuery } from '@tanstack/react-query';
import { AdminMetricsService } from '../services';

/**
 * Hook to fetch admin dashboard metrics
 */
export const useAdminMetrics = () => {
  const {
    data: metrics,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['admin-dashboard-metrics'],
    queryFn: AdminMetricsService.fetchDashboardMetrics,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    metrics,
    isLoading,
    error,
    refetch
  };
};

/**
 * Hook to fetch organizations with statistics
 */
export const useOrganizationStats = () => {
  const {
    data: organizations,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['admin-organizations-stats'],
    queryFn: AdminMetricsService.fetchOrganizationsWithStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    organizations,
    isLoading,
    error,
    refetch
  };
};

/**
 * Hook to fetch user activity
 */
export const useUserActivityData = () => {
  const {
    data: activity,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['admin-user-activity'],
    queryFn: AdminMetricsService.fetchUserActivity,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    activity,
    isLoading,
    error,
    refetch
  };
};
