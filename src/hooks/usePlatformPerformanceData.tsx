import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const usePlatformPerformanceData = () => {
  return useQuery({
    queryKey: ['platform-performance-data'],
    queryFn: async () => {
      const { data: platformData, error } = await supabase
        .from('platforms')
        .select(`
          name,
          job_platform_associations(
            job_listings(
              id,
              daily_spend(amount),
              applications(id, source)
            )
          )
        `);

      if (error) throw error;

      // Group data by platform, consolidating Meta sources
      const consolidatedData = platformData.reduce((acc: any, platform: any) => {
        let platformName = platform.name;
        
        // Check if any applications are from fb/ig sources through job platform associations
        const hasMetaSources = platform.job_platform_associations.some((assoc: any) =>
          assoc.job_listings.applications.some((app: any) => app.source === 'fb' || app.source === 'ig')
        );
        
        if (platformName === 'Facebook' || platformName === 'Instagram' || platformName === 'Meta' || hasMetaSources) {
          platformName = 'Meta';
        }

        if (!acc[platformName]) {
          acc[platformName] = { applications: 0, spend: 0 };
        }

        const applications = platform.job_platform_associations.reduce((appAcc: number, assoc: any) => 
          appAcc + assoc.job_listings.applications.length, 0);
        const spend = platform.job_platform_associations.reduce((spendAcc: number, assoc: any) => 
          spendAcc + assoc.job_listings.daily_spend.reduce((sum: number, spend: any) => sum + Number(spend.amount), 0), 0);

        acc[platformName].applications += applications;
        acc[platformName].spend += spend;

        return acc;
      }, {});

      return Object.entries(consolidatedData)
        .map(([platform, data]: [string, any]) => {
          const cpa = data.applications > 0 ? data.spend / data.applications : 0;
          return {
            platform,
            applications: data.applications,
            spend: Number(data.spend.toFixed(2)),
            cpa: Number(cpa.toFixed(2))
          };
        })
        .filter((platform: any) => platform.applications > 0 || platform.spend > 0) // Filter out empty platforms
        .sort((a: any, b: any) => b.applications - a.applications); // Sort by applications descending
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};