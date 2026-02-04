import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';

const PAGE_SIZE = 50;

export type PublicJobSortOption = 'recent' | 'title' | 'salary-high' | 'salary-low';

interface UsePaginatedPublicJobsParams {
  searchTerm?: string;
  locationFilter?: string;
  categoryFilter?: string;
  clientFilter?: string;
  sortBy?: PublicJobSortOption;
}

// Sorting configuration for database queries
const getSortConfig = (sortBy: PublicJobSortOption): { column: string; ascending: boolean } => {
  switch (sortBy) {
    case 'title':
      return { column: 'title', ascending: true };
    case 'salary-high':
      return { column: 'salary_max', ascending: false };
    case 'salary-low':
      return { column: 'salary_min', ascending: true };
    case 'recent':
    default:
      return { column: 'created_at', ascending: false };
  }
};

export function usePaginatedPublicJobs({
  searchTerm = '',
  locationFilter = '',
  categoryFilter = '',
  clientFilter = '',
  sortBy = 'recent'
}: UsePaginatedPublicJobsParams = {}) {
  const [page, setPage] = useState(0);
  const [allJobs, setAllJobs] = useState<any[]>([]);

  // Reset pagination when filters or sort change
  useEffect(() => {
    setPage(0);
    setAllJobs([]);
  }, [searchTerm, locationFilter, categoryFilter, clientFilter, sortBy]);

  const sortConfig = getSortConfig(sortBy);

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: queryKeys.public.jobsPaginated(page, { searchTerm, locationFilter, categoryFilter, clientFilter, sortBy }),
    queryFn: async () => {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // Build query with server-side sorting
      let query = supabase
        .from('job_listings')
        .select(`
          *,
          job_categories(name)
        `, { count: 'exact' })
        .eq('status', 'active')
        .eq('is_hidden', false)
        .order(sortConfig.column, { ascending: sortConfig.ascending })
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

        // Fetch client info securely via public view (org info hidden for privacy)
        // Note: Voice agent matching removed - using global agent for all jobs
        if (data && data.length > 0) {
          const clientIds = [...new Set(data.map(job => job.client_id).filter(Boolean))] as string[];
          
          // Fetch client data only (organization hidden for privacy)
          const { data: clientData } = await supabase
            .from('public_client_info')
            .select('id, name, logo_url')
            .in('id', clientIds);
          
          // Create lookup map
          const clientMap = new Map(clientData?.map(client => [client.id, client]) || []);
          
          // Attach client info to jobs (no org info exposed)
          // All jobs now have voice apply enabled via global agent
          const jobsWithClients = data
            .map(job => {
              const client = job.client_id ? clientMap.get(job.client_id) : null;
              
              return {
                ...job,
                clients: client,
                voiceAgent: { global: true } // Global agent available for all jobs
              };
            });
          
          return { jobs: jobsWithClients, count: count || 0 };
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
