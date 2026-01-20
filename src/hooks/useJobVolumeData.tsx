import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';

export const useJobVolumeData = () => {
  return useQuery({
    queryKey: queryKeys.jobs.volume(),
    queryFn: async () => {
      const { data: jobsData, error } = await supabase
        .from('job_listings')
        .select('created_at, title, status')
        .order('created_at', { ascending: true })
        .limit(30);

      if (error) throw error;

      // Group by date and count jobs
      const groupedData = jobsData.reduce((acc: any, curr: any) => {
        const date = new Date(curr.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!acc[date]) {
          acc[date] = { date, active: 0, inactive: 0, total: 0 };
        }
        acc[date].total += 1;
        if (curr.status === 'active') {
          acc[date].active += 1;
        } else {
          acc[date].inactive += 1;
        }
        return acc;
      }, {});

      return Object.values(groupedData).slice(-7); // Last 7 days
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};