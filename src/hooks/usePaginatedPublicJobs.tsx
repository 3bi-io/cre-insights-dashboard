import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
    queryKey: ['public-jobs-paginated', page, searchTerm, locationFilter, categoryFilter, clientFilter],
    queryFn: async () => {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('job_listings')
        .select(`
          *,
          organizations!inner(
            name, 
            slug,
            id
          ),
          job_categories(name),
          clients(name, logo_url)
        `, { count: 'exact' })
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(from, to);

      // Apply search filter
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,job_title.ilike.%${searchTerm}%,job_summary.ilike.%${searchTerm}%`);
      }

      // Apply location filter
      if (locationFilter && locationFilter !== '__ALL__') {
        query = query.or(`city.ilike.%${locationFilter}%,state.ilike.%${locationFilter}%,location.ilike.%${locationFilter}%`);
      }

      // Apply client filter
      if (clientFilter && clientFilter !== '__ALL__') {
        query = query.eq('client_id', clientFilter);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      // Fetch voice agents for organizations
      if (data && data.length > 0) {
        const orgIds = [...new Set(data.map(job => job.organizations?.id).filter(Boolean))];
        const { data: voiceAgents } = await supabase
          .from('voice_agents')
          .select('*')
          .in('organization_id', orgIds)
          .eq('is_active', true);

        // Attach voice agents to jobs
        const jobsWithVoiceAgents = data.map(job => ({
          ...job,
          voiceAgent: voiceAgents?.find(va => va.organization_id === job.organizations?.id)
        }));

        return { jobs: jobsWithVoiceAgents, count };
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
