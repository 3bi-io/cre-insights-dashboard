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
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 20000, // Data considered fresh for 20 seconds
  });

  return {
    platforms,
    isLoading,
    error,
    refetch
  };
};
