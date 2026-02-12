import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface RecruiterSLAMetrics {
  totalApplications: number;
  respondedCount: number;
  responseRate: number;
  avgResponseHours: number;
  medianResponseHours: number;
  withinOneHour: number;
  withinFourHours: number;
  withinTwentyFourHours: number;
  byRecruiter: RecruiterBreakdown[];
}

interface RecruiterBreakdown {
  recruiterId: string;
  recruiterName: string;
  totalAssigned: number;
  respondedCount: number;
  avgResponseHours: number;
}

/**
 * Hook for Recruiter SLA tracking metrics
 */
export const useRecruiterSLA = (days: number = 30) => {
  return useQuery({
    queryKey: ['recruiter-sla', days],
    queryFn: async (): Promise<RecruiterSLAMetrics> => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Fetch applications with response times
      const { data: apps, error } = await supabase
        .from('applications')
        .select('id, created_at, first_response_at, recruiter_id, status')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const applications = apps || [];
      const totalApplications = applications.length;
      
      // Calculate response times
      const responded = applications.filter(a => a.first_response_at);
      const respondedCount = responded.length;
      const responseRate = totalApplications > 0 ? (respondedCount / totalApplications) * 100 : 0;

      const responseTimes = responded.map(a => {
        const created = new Date(a.created_at!).getTime();
        const responded = new Date(a.first_response_at!).getTime();
        return (responded - created) / (1000 * 60 * 60); // hours
      }).sort((a, b) => a - b);

      const avgResponseHours = responseTimes.length > 0
        ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
        : 0;

      const medianResponseHours = responseTimes.length > 0
        ? responseTimes[Math.floor(responseTimes.length / 2)]
        : 0;

      const withinOneHour = responseTimes.filter(t => t <= 1).length;
      const withinFourHours = responseTimes.filter(t => t <= 4).length;
      const withinTwentyFourHours = responseTimes.filter(t => t <= 24).length;

      // Group by recruiter
      const recruiterMap = new Map<string, { total: number; responded: number; totalHours: number }>();
      applications.forEach(app => {
        if (!app.recruiter_id) return;
        const entry = recruiterMap.get(app.recruiter_id) || { total: 0, responded: 0, totalHours: 0 };
        entry.total++;
        if (app.first_response_at) {
          entry.responded++;
          const hours = (new Date(app.first_response_at).getTime() - new Date(app.created_at!).getTime()) / (1000 * 60 * 60);
          entry.totalHours += hours;
        }
        recruiterMap.set(app.recruiter_id, entry);
      });

      const byRecruiter: RecruiterBreakdown[] = Array.from(recruiterMap.entries()).map(([id, data]) => ({
        recruiterId: id,
        recruiterName: id.substring(0, 8), // Will be enriched with actual name in UI
        totalAssigned: data.total,
        respondedCount: data.responded,
        avgResponseHours: data.responded > 0 ? data.totalHours / data.responded : 0,
      }));

      return {
        totalApplications,
        respondedCount,
        responseRate,
        avgResponseHours,
        medianResponseHours,
        withinOneHour,
        withinFourHours,
        withinTwentyFourHours,
        byRecruiter,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};
