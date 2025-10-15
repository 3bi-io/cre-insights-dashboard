import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services';
import { useAuth } from '@/hooks/useAuth';

export const useMonthlyBudgetData = () => {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['monthlyBudget', organization?.id],
    queryFn: () => analyticsService.getMonthlyBudgetData(organization?.id),
    staleTime: 5 * 60 * 1000,
  });
};
