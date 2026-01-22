/**
 * Hook for tracking application distribution by source platform
 * Migrated from src/hooks/usePlatformDistributionData.tsx
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/queryKeys';

const PLATFORM_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];

export const usePlatformDistributionData = () => {
  const { organization } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.analytics.platformDistribution(organization?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          source,
          job_listings!inner(
            organization_id,
            job_platform_associations!inner(
              platforms!inner(name)
            )
          )
        `)
        .eq('job_listings.organization_id', organization?.id);

      if (error) throw error;

      // Count applications by platform, consolidating Meta sources
      const platformCounts = data.reduce((acc: any, curr: any) => {
        // Handle multiple platforms per job
        curr.job_listings.job_platform_associations.forEach((assoc: any) => {
          let platformName = assoc.platforms.name;
          
          // Consolidate Facebook and Instagram under Meta
          if (curr.source === 'fb' || curr.source === 'ig' || platformName === 'Facebook' || platformName === 'Instagram' || platformName === 'Meta') {
            platformName = 'Meta';
          }
          
          acc[platformName] = (acc[platformName] || 0) + 1;
        });
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
    enabled: !!organization?.id, // Only run when organization is available
  });
};
