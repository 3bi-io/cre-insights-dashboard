import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/queryKeys';

export const useDashboardMetrics = () => {
  const { organization } = useAuth();

  return useQuery({
    queryKey: queryKeys.analytics.metrics(organization?.id),
    queryFn: () => analyticsService.getDashboardMetrics(organization?.id),
    staleTime: 5 * 60 * 1000,
  });
};
