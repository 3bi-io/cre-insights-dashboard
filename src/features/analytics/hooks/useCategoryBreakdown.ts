import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services';
import { useAuth } from '@/hooks/useAuth';

export const useCategoryBreakdown = () => {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['categoryBreakdown', organization?.id],
    queryFn: () => analyticsService.getCategoryBreakdown(organization?.id),
    staleTime: 5 * 60 * 1000,
  });
};
