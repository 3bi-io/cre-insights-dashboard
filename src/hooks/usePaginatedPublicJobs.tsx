import { useState, useEffect, useMemo } from 'react';
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

/** Get or create a deterministic session seed for randomized job ordering */
function getSessionSeed(): string {
  const KEY = 'job_seed';
  let seed = sessionStorage.getItem(KEY);
  if (!seed) {
    seed = crypto.randomUUID();
    sessionStorage.setItem(KEY, seed);
  }
  return seed;
}

export function usePaginatedPublicJobs({
  searchTerm = '',
  locationFilter = '',
  categoryFilter = '',
  clientFilter = '',
  sortBy = 'recent'
}: UsePaginatedPublicJobsParams = {}) {
  const [page, setPage] = useState(0);
  const [allJobs, setAllJobs] = useState<any[]>([]);

  // Stable session seed — generated once per browser session
  const sessionSeed = useMemo(() => getSessionSeed(), []);

  const useRandomOrder = sortBy === 'recent';

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

      // ── Randomised path (default "recent" sort) ──
      if (useRandomOrder) {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_random_jobs', {
          _seed: sessionSeed,
          _limit: PAGE_SIZE,
          _offset: from,
          _search: searchTerm,
          _location: locationFilter,
          _client_id: clientFilter || null,
          _category_id: categoryFilter || null,
        });

        if (rpcError) throw rpcError;

        const rows = rpcData || [];
        const totalCount = rows.length > 0 ? (rows[0] as any).total_count : 0;

        // Strip total_count from each row and enrich with client info
        const cleanRows = rows.map((r: any) => {
          const { total_count, ...rest } = r;
          return rest;
        });

        // Fetch client + category info for these jobs
        const enriched = await enrichJobs(cleanRows);

        return { jobs: enriched, count: Number(totalCount) };
      }

      // ── Deterministic sort path (title, salary) ──
      const to = from + PAGE_SIZE - 1;

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

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,job_title.ilike.%${searchTerm}%,job_summary.ilike.%${searchTerm}%`);
      }
      if (locationFilter) {
        query = query.or(`city.ilike.%${locationFilter}%,state.ilike.%${locationFilter}%,location.ilike.%${locationFilter}%`);
      }
      if (clientFilter) {
        query = query.eq('client_id', clientFilter);
      }
      if (categoryFilter) {
        query = query.eq('category_id', categoryFilter);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      const enriched = await enrichJobs(data || []);
      return { jobs: enriched, count: count || 0 };
    },
    staleTime: 1000 * 60 * 2,
  });

  // Accumulate jobs as pages load
  useEffect(() => {
    if (data?.jobs) {
      setAllJobs(prev => {
        if (page === 0) return data.jobs;
        const existingIds = new Set(prev.map(j => j.id));
        const newJobs = data.jobs.filter((j: any) => !existingIds.has(j.id));
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

/**
 * Enrich raw job rows with client info and voice agent flag.
 * Shared by both the RPC and regular query paths.
 */
async function enrichJobs(jobs: any[]): Promise<any[]> {
  if (!jobs || jobs.length === 0) return jobs;

  const clientIds = [...new Set(jobs.map(job => job.client_id).filter(Boolean))] as string[];

  const { data: clientData } = await supabase
    .from('public_client_info')
    .select('id, name, logo_url')
    .in('id', clientIds);

  const clientMap = new Map(clientData?.map(client => [client.id, client]) || []);

  // Check which orgs/clients have active voice agents
  const orgIds = [...new Set(jobs.map(j => j.organization_id).filter(Boolean))] as string[];
  
  // Query voice agents for these orgs (inbound agents — not requiring outbound fields)
  const { data: agentData } = await supabase
    .from('voice_agents')
    .select('organization_id, client_id')
    .in('organization_id', orgIds.length > 0 ? orgIds : ['__none__'])
    .eq('is_active', true);

  // Build a set of "orgId:clientId" keys — only client-specific agents (no org-level fallback)
  const agentKeys = new Set<string>();
  agentData?.forEach(a => {
    if (a.client_id) {
      agentKeys.add(`${a.organization_id}:${a.client_id}`);
    }
  });

  return jobs.map(job => {
    const client = job.client_id ? clientMap.get(job.client_id) : null;
    // Only client-specific agents trigger voice CTA (no org-level fallback)
    const hasAgent = job.organization_id && job.client_id && agentKeys.has(`${job.organization_id}:${job.client_id}`);
    return {
      ...job,
      clients: client,
      voiceAgent: hasAgent ? { assigned: true } : null,
    };
  });
}
