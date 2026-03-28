import { useQuery } from '@tanstack/react-query';
import { PlatformService } from '../services';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Hook to fetch and manage platforms data with caching
 */
export const usePlatformData = () => {
  const { 
    data: platforms, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: queryKeys.platforms.list(),
    queryFn: PlatformService.fetchPlatforms,
    refetchInterval: 60000, // Refresh every 60 seconds
    refetchIntervalInBackground: false,
    staleTime: 45000, // Data considered fresh for 45 seconds
  });

  return {
    platforms,
    isLoading,
    error,
    refetch
  };
};
