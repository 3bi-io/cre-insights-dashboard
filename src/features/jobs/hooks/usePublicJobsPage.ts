import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePaginatedPublicJobs } from '@/hooks/usePaginatedPublicJobs';
import { queryKeys } from '@/lib/queryKeys';
import type { PublicJob, PublicJobSortOption, PublicClientOption } from '../types';

export interface UsePublicJobsPageReturn {
  // Filter state
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  locationFilter: string;
  setLocationFilter: (value: string) => void;
  clientFilter: string;
  setClientFilter: (value: string) => void;
  sortBy: PublicJobSortOption;
  setSortBy: (value: PublicJobSortOption) => void;

  // Data
  jobs: PublicJob[];
  totalCount: number;
  locations: string[];
  clients: PublicClientOption[];

  // Loading states
  isLoading: boolean;
  isFetchingMore: boolean;
  hasMore: boolean;
  error: Error | null;

  // Actions
  loadMore: () => void;
}

/**
 * Hook to manage all state and data for the public jobs page
 * Encapsulates filter state, pagination, and derived data
 */
export function usePublicJobsPage(): UsePublicJobsPageReturn {
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [sortBy, setSortBy] = useState<PublicJobSortOption>('recent');

  // Fetch paginated jobs with filters and sorting
  const {
    jobs: rawJobs,
    totalCount,
    isLoading,
    isFetchingMore,
    hasMore,
    loadMore,
    error
  } = usePaginatedPublicJobs({
    searchTerm,
    locationFilter,
    clientFilter,
    sortBy
  });

  // Type-safe jobs array
  const jobs = rawJobs as PublicJob[];

  // Fetch all clients that have active job listings via public view
  const { data: allClients } = useQuery({
    queryKey: queryKeys.clients.public(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('public_client_info')
        .select('id, name, logo_url')
        .order('name');
      
      if (error) throw error;
      return (data || []) as PublicClientOption[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Derive unique locations from loaded jobs
  const locations = useMemo(() => {
    if (!jobs || jobs.length === 0) return [];
    const locationSet = new Set<string>();
    jobs.forEach(job => {
      if (job.city && job.state) {
        locationSet.add(`${job.city}, ${job.state}`);
      }
      if (job.location) {
        locationSet.add(job.location);
      }
    });
    return Array.from(locationSet).sort();
  }, [jobs]);

  // Memoized clients list
  const clients = useMemo(() => allClients || [], [allClients]);

  return {
    // Filter state
    searchTerm,
    setSearchTerm,
    locationFilter,
    setLocationFilter,
    clientFilter,
    setClientFilter,
    sortBy,
    setSortBy,

    // Data
    jobs,
    totalCount,
    locations,
    clients,

    // Loading states
    isLoading,
    isFetchingMore,
    hasMore,
    error: error as Error | null,

    // Actions
    loadMore
  };
}
