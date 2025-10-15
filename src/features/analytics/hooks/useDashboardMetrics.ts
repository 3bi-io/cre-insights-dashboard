import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services';
import { useAuth } from '@/hooks/useAuth';

export const useDashboardMetrics = () => {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['dashboardMetrics', organization?.id],
    queryFn: () => analyticsService.getDashboardMetrics(organization?.id),
    staleTime: 5 * 60 * 1000,
  });
};
