import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface JobData {
  id: string;
  title: string;
  location: string;
  salary_min: number | null;
  salary_max: number | null;
  status: string;
  created_at: string;
  application_count: number;
}

interface JobMetrics {
  activeJobs: number;
  totalApplications: number;
  averageSalary: number;
  recentJobs: JobData[];
}

export const useOrganizationJobData = () => {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['organization-job-data', organization?.id],
    queryFn: async (): Promise<JobMetrics> => {
      if (!organization?.id) {
        return {
          activeJobs: 0,
          totalApplications: 0,
          averageSalary: 0,
          recentJobs: [],
        };
      }

      // Get active jobs count and recent jobs
      const { data: jobs, count: activeJobs } = await supabase
        .from('job_listings')
        .select('*', { count: 'exact' })
        .eq('organization_id', organization.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(3);

      // Get total applications for organization's jobs
      const { data: allOrgJobs } = await supabase
        .from('job_listings')
        .select('id')
        .eq('organization_id', organization.id);

      let totalApplications = 0;
      if (allOrgJobs && allOrgJobs.length > 0) {
        const { count } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .in('job_listing_id', allOrgJobs.map(j => j.id));
        totalApplications = count || 0;
      }

      // Calculate average salary
      const { data: salaryData } = await supabase
        .from('job_listings')
        .select('salary_min, salary_max')
        .eq('organization_id', organization.id)
        .not('salary_min', 'is', null)
        .not('salary_max', 'is', null);

      let averageSalary = 0;
      if (salaryData && salaryData.length > 0) {
        const totalSalary = salaryData.reduce((sum, job) => {
          const min = Number(job.salary_min) || 0;
          const max = Number(job.salary_max) || 0;
          return sum + (min + max) / 2;
        }, 0);
        averageSalary = Math.round(totalSalary / salaryData.length);
      }

      // Get application counts for recent jobs
      const recentJobsWithCounts = await Promise.all(
        (jobs || []).map(async (job) => {
          const { count } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('job_listing_id', job.id);

          return {
            id: job.id,
            title: job.title,
            location: job.location || 'Not specified',
            salary_min: job.salary_min,
            salary_max: job.salary_max,
            status: job.status,
            created_at: job.created_at,
            application_count: count || 0,
          };
        })
      );

      return {
        activeJobs: activeJobs || 0,
        totalApplications,
        averageSalary,
        recentJobs: recentJobsWithCounts,
      };
    },
    enabled: !!organization?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};