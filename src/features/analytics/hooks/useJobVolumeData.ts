import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/queryKeys';

export const useJobVolumeData = () => {
  const { organization } = useAuth();

  return useQuery({
    queryKey: queryKeys.analytics.jobVolume(organization?.id),
    queryFn: () => analyticsService.getJobVolumeData(organization?.id),
    staleTime: 5 * 60 * 1000,
  });
};
