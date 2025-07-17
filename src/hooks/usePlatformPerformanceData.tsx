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
          job_listings(
            id,
            daily_spend(amount),
            applications(id)
          )
        `);

      if (error) throw error;

      return platformData
        .map((platform: any) => {
          const applications = platform.job_listings.reduce((acc: number, job: any) => 
            acc + job.applications.length, 0);
          const spend = platform.job_listings.reduce((acc: number, job: any) => 
            acc + job.daily_spend.reduce((sum: number, spend: any) => sum + Number(spend.amount), 0), 0);
          const cpa = applications > 0 ? spend / applications : 0;

          return {
            platform: platform.name,
            applications,
            spend: Number(spend.toFixed(2)),
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