import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/queryKeys';

export const usePlatformPerformanceData = () => {
  const { organization } = useAuth();

  return useQuery({
    queryKey: queryKeys.analytics.platformPerformance(organization?.id),
    queryFn: () => analyticsService.getPlatformPerformanceData(organization?.id),
    staleTime: 5 * 60 * 1000,
  });
};
