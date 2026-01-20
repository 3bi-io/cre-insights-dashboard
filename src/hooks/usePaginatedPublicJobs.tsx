import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';

const PAGE_SIZE = 50;

interface UsePaginatedPublicJobsParams {
  searchTerm?: string;
  locationFilter?: string;
  categoryFilter?: string;
  clientFilter?: string;
}

export function usePaginatedPublicJobs({
  searchTerm = '',
  locationFilter = '',
  categoryFilter = '',
  clientFilter = ''
}: UsePaginatedPublicJobsParams = {}) {
  const [page, setPage] = useState(0);
  const [allJobs, setAllJobs] = useState<any[]>([]);

  // Reset pagination when filters change
  useEffect(() => {
    setPage(0);
    setAllJobs([]);
  }, [searchTerm, locationFilter, categoryFilter, clientFilter]);

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: queryKeys.public.jobsPaginated(page, { searchTerm, locationFilter, categoryFilter, clientFilter }),
    queryFn: async () => {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // First fetch job listings with related data
      // Note: organizations join uses public_organization_info view for security
      // Note: clients data is fetched separately from public_client_info view
      let query = supabase
        .from('job_listings')
        .select(`
          *,
          job_categories(name)
        `, { count: 'exact' })
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(from, to);

      // Apply search filter
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,job_title.ilike.%${searchTerm}%,job_summary.ilike.%${searchTerm}%`);
      }

      // Apply location filter (empty string means "all")
      if (locationFilter) {
        query = query.or(`city.ilike.%${locationFilter}%,state.ilike.%${locationFilter}%,location.ilike.%${locationFilter}%`);
      }

      // Apply client filter (empty string means "all")
      if (clientFilter) {
        query = query.eq('client_id', clientFilter);
      }

      const { data, error, count } = await query;
      if (error) throw error;

        // Fetch organization and client info securely via public views
        // Note: Voice agent matching removed - using global agent for all jobs
        if (data && data.length > 0) {
          const orgIds = [...new Set(data.map(job => job.organization_id).filter(Boolean))] as string[];
          const clientIds = [...new Set(data.map(job => job.client_id).filter(Boolean))] as string[];
          
          // Fetch organization data and client data in parallel
          const [orgResult, clientResult] = await Promise.all([
            supabase
              .from('public_organization_info')
              .select('id, name, slug, logo_url')
              .in('id', orgIds),
            supabase
              .from('public_client_info')
              .select('id, name, logo_url')
              .in('id', clientIds)
          ]);
          
          // Create lookup maps
          const orgMap = new Map(orgResult.data?.map(org => [org.id, org]) || []);
          const clientMap = new Map(clientResult.data?.map(client => [client.id, client]) || []);
          
          // Attach organization and client info to jobs and filter out ACME
          // All jobs now have voice apply enabled via global agent
          const jobsWithOrgs = data
            .map(job => {
              const org = job.organization_id ? orgMap.get(job.organization_id) : null;
              const client = job.client_id ? clientMap.get(job.client_id) : null;
              
              return {
                ...job,
                organizations: org,
                clients: client,
                voiceAgent: { global: true } // Global agent available for all jobs
              };
            })
            .filter(job => {
              const org = job.organizations;
              return !org || org.slug !== 'acme';
            });
          
          return { jobs: jobsWithOrgs, count: count || 0 };
        }

      return { jobs: data || [], count: count || 0 };
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Accumulate jobs as pages load
  useEffect(() => {
    if (data?.jobs) {
      setAllJobs(prev => {
        if (page === 0) return data.jobs;
        const existingIds = new Set(prev.map(j => j.id));
        const newJobs = data.jobs.filter(j => !existingIds.has(j.id));
        return [...prev, ...newJobs];
      });
    }
  }, [data, page]);

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  const hasMore = data ? allJobs.length < (data.count || 0) : false;

  return {
    jobs: allJobs,
    totalCount: data?.count || 0,
    isLoading: isLoading && page === 0,
    isFetchingMore: isFetching && page > 0,
    error,
    hasMore,
    loadMore
  };
}
