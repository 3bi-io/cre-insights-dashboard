
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import { logger } from '@/lib/logger';

export const usePlatforms = () => {
  const { data: platforms, isLoading, refetch } = useQuery({
    queryKey: queryKeys.platforms.all,
    queryFn: async () => {
      logger.debug('Fetching platforms...', { context: 'usePlatforms' });
      const { data, error } = await supabase
        .from('platforms')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) {
        logger.error('Error fetching platforms', error, { context: 'usePlatforms' });
        throw error;
      }
      
      logger.debug('Platforms fetched', { count: data?.length, context: 'usePlatforms' });
      return data;
    },
    // Refresh every 60 seconds to reduce resource consumption
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
  });

  return {
    platforms,
    isLoading,
    refetch
  };
};
