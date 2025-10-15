import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services';
import { useAuth } from '@/hooks/useAuth';

export const useJobVolumeData = () => {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['jobVolume', organization?.id],
    queryFn: () => analyticsService.getJobVolumeData(organization?.id),
    staleTime: 5 * 60 * 1000,
  });
};
