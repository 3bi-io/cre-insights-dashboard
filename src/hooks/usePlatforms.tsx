
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const usePlatforms = () => {
  const { data: platforms, isLoading, refetch } = useQuery({
    queryKey: ['platforms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platforms')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Error fetching platforms:', error);
        throw error;
      }
      
      return data;
    },
    // Refresh every 30 seconds to stay in sync
    refetchInterval: 30000,
  });

  return {
    platforms,
    isLoading,
    refetch
  };
};
