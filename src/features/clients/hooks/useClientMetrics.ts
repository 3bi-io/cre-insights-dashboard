import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ClientMetrics {
  id: string;
  name: string;
  status: string;
  logo_url: string | null;
  city: string | null;
  state: string | null;
  jobCount: number;
  activeJobCount: number;
  applicationCount: number;
  recentApplications: number; // Last 30 days
  avgApplicationsPerJob: number;
}

export interface ClientMetricsSummary {
  totalClients: number;
  activeClients: number;
  totalJobs: number;
  totalApplications: number;
  avgApplicationsPerClient: number;
}

interface UseClientMetricsReturn {
  clients: ClientMetrics[];
  summary: ClientMetricsSummary;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useClientMetrics(): UseClientMetricsReturn {
  const { organization } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['client-metrics', organization?.id],
    queryFn: async () => {
      if (!organization?.id) {
        return { clients: [], summary: getEmptySummary() };
      }

      // Fetch clients with their job listings and application counts
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select(`
          id,
          name,
          status,
          logo_url,
          city,
          state,
          job_listings (
            id,
            status,
            applications (
              id,
              applied_at
            )
          )
        `)
        .eq('organization_id', organization.id)
        .order('name');

      if (clientsError) {
        throw new Error(clientsError.message);
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Process clients into metrics
      const clientMetrics: ClientMetrics[] = (clientsData || []).map((client: any) => {
        const jobs = client.job_listings || [];
        const jobCount = jobs.length;
        const activeJobCount = jobs.filter((j: any) => j.status === 'active').length;
        
        // Flatten all applications from all jobs
        const allApplications = jobs.flatMap((j: any) => j.applications || []);
        const applicationCount = allApplications.length;
        
        // Count recent applications
        const recentApplications = allApplications.filter((app: any) => {
          if (!app.applied_at) return false;
          return new Date(app.applied_at) >= thirtyDaysAgo;
        }).length;

        const avgApplicationsPerJob = jobCount > 0 
          ? Math.round((applicationCount / jobCount) * 10) / 10 
          : 0;

        return {
          id: client.id,
          name: client.name,
          status: client.status,
          logo_url: client.logo_url,
          city: client.city,
          state: client.state,
          jobCount,
          activeJobCount,
          applicationCount,
          recentApplications,
          avgApplicationsPerJob,
        };
      });

      // Calculate summary
      const summary: ClientMetricsSummary = {
        totalClients: clientMetrics.length,
        activeClients: clientMetrics.filter(c => c.status === 'active').length,
        totalJobs: clientMetrics.reduce((sum, c) => sum + c.jobCount, 0),
        totalApplications: clientMetrics.reduce((sum, c) => sum + c.applicationCount, 0),
        avgApplicationsPerClient: clientMetrics.length > 0
          ? Math.round(clientMetrics.reduce((sum, c) => sum + c.applicationCount, 0) / clientMetrics.length)
          : 0,
      };

      return { clients: clientMetrics, summary };
    },
    enabled: !!organization?.id,
  });

  return {
    clients: data?.clients || [],
    summary: data?.summary || getEmptySummary(),
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

function getEmptySummary(): ClientMetricsSummary {
  return {
    totalClients: 0,
    activeClients: 0,
    totalJobs: 0,
    totalApplications: 0,
    avgApplicationsPerClient: 0,
  };
}
