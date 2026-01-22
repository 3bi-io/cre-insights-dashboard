/**
 * Hook for aggregating platform performance data across all ad platforms
 * Migrated from src/hooks/usePlatformPerformanceData.tsx
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/queryKeys';

export const usePlatformPerformanceData = () => {
  const { organization } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.analytics.platformPerformance(organization?.id),
    queryFn: async () => {
      // Get Meta data for current organization
      let metaQuery = supabase
        .from('meta_daily_spend')
        .select('spend, impressions, clicks');
        
      if (organization?.id) {
        metaQuery = metaQuery.eq('organization_id', organization.id);
      }

      const { data: metaData, error: metaError } = await metaQuery;

      if (metaError) throw metaError;

      // Get applications from Meta sources (organization-scoped)
      const { data: applicationsData, error: appsError } = await supabase
        .from('applications')
        .select('id, source, job_listings!inner(organization_id)')
        .or('source.eq.fb,source.eq.ig,source.eq.meta')
        .eq('job_listings.organization_id', organization?.id);

      if (appsError) throw appsError;

      // Get other platform data (non-Meta, organization-scoped)
      const { data: platformData, error } = await supabase
        .from('platforms')
        .select(`
          name,
          job_platform_associations(
            job_listings(
              id,
              organization_id,
              daily_spend(amount),
              applications(id, source)
            )
          )
        `)
        .not('name', 'ilike', '%meta%')
        .not('name', 'ilike', '%facebook%')
        .not('name', 'ilike', '%instagram%')
        .eq('job_platform_associations.job_listings.organization_id', organization?.id);

      if (error) throw error;

      // Calculate Meta (CR England) performance
      const metaSpend = metaData?.reduce((sum, record) => sum + (record.spend || 0), 0) || 0;
      const metaApplications = applicationsData?.length || 0;
      const metaCpa = metaApplications > 0 ? metaSpend / metaApplications : 0;

      // Process other platforms
      const otherPlatforms = platformData.reduce((acc: any, platform: any) => {
        const applications = platform.job_platform_associations.reduce((appAcc: number, assoc: any) => 
          appAcc + assoc.job_listings.applications.length, 0);
        const spend = platform.job_platform_associations.reduce((spendAcc: number, assoc: any) => 
          spendAcc + assoc.job_listings.daily_spend.reduce((sum: number, spend: any) => sum + Number(spend.amount), 0), 0);

        if (applications > 0 || spend > 0) {
          const cpa = applications > 0 ? spend / applications : 0;
          acc.push({
            platform: platform.name,
            applications,
            spend: Number(spend.toFixed(2)),
            cpa: Number(cpa.toFixed(2))
          });
        }
        return acc;
      }, []);

      // Combine Meta and other platforms
      const allPlatforms = [
        {
          platform: 'Meta (CR England)',
          applications: metaApplications,
          spend: Number(metaSpend.toFixed(2)),
          cpa: Number(metaCpa.toFixed(2))
        },
        ...otherPlatforms
      ].filter((platform: any) => platform.applications > 0 || platform.spend > 0)
       .sort((a: any, b: any) => b.applications - a.applications);

      return allPlatforms;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!organization?.id, // Only run when organization is available
  });
};
