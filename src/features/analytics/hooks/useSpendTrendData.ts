import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services';
import { useAuth } from '@/hooks/useAuth';

export const useSpendTrendData = () => {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['spendTrend', organization?.id],
    queryFn: () => analyticsService.getSpendTrendData(organization?.id),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
