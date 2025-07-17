import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const PLATFORM_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];

export const usePlatformDistributionData = () => {
  return useQuery({
    queryKey: ['platform-distribution-data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          job_listings!inner(
            platform_id,
            platforms!inner(name)
          )
        `);

      if (error) throw error;

      // Count applications by platform
      const platformCounts = data.reduce((acc: any, curr: any) => {
        const platformName = curr.job_listings.platforms.name;
        acc[platformName] = (acc[platformName] || 0) + 1;
        return acc;
      }, {});

      // Convert to chart format with colors
      return Object.entries(platformCounts)
        .map(([name, value], index) => ({
          name,
          value: value as number,
          color: PLATFORM_COLORS[index % PLATFORM_COLORS.length]
        }))
        .sort((a, b) => b.value - a.value); // Sort by value descending
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};