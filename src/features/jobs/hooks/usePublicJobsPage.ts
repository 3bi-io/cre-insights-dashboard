import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { usePaginatedPublicJobs } from '@/hooks/usePaginatedPublicJobs';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { queryKeys } from '@/lib/queryKeys';
import type { PublicJob, PublicJobSortOption, PublicClientOption } from '../types';

export interface PublicCategoryOption {
  id: string;
  name: string;
}

export interface UsePublicJobsPageReturn {
  // Filter state
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  locationFilter: string;
  setLocationFilter: (value: string) => void;
  clientFilter: string;
  setClientFilter: (value: string) => void;
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  sortBy: PublicJobSortOption;
  setSortBy: (value: PublicJobSortOption) => void;

  // Data
  jobs: PublicJob[];
  totalCount: number;
  locations: string[];
  clients: PublicClientOption[];
  categories: PublicCategoryOption[];

  // Loading states
  isLoading: boolean;
  isFetchingMore: boolean;
  hasMore: boolean;
  error: Error | null;

  // Actions
  loadMore: () => void;
}

const VALID_SORTS: PublicJobSortOption[] = ['recent', 'title', 'salary-high', 'salary-low'];

/**
 * Hook to manage all state and data for the public jobs page
 * Encapsulates filter state, pagination, and derived data
 * All filters are synced to URL search params for shareability
 */
export function usePublicJobsPage(): UsePublicJobsPageReturn {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialise filter state from URL params
  const [searchTerm, setSearchTermLocal] = useState(() => searchParams.get('q') ?? '');
  const [locationFilter, setLocationFilterLocal] = useState(() => searchParams.get('location') ?? '');
  const [clientFilter, setClientFilterLocal] = useState(() => searchParams.get('client') ?? '');
  const [categoryFilter, setCategoryFilterLocal] = useState(() => searchParams.get('category') ?? '');
  const [sortBy, setSortByLocal] = useState<PublicJobSortOption>(() => {
    const param = searchParams.get('sort');
    return param && VALID_SORTS.includes(param as PublicJobSortOption)
      ? (param as PublicJobSortOption)
      : 'recent';
  });

  // URL sync helper — updates URL params without navigation
  const updateParams = useCallback((key: string, value: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // Wrapped setters that sync to URL
  const setSearchTerm = useCallback((v: string) => { setSearchTermLocal(v); updateParams('q', v); }, [updateParams]);
  const setLocationFilter = useCallback((v: string) => { setLocationFilterLocal(v); updateParams('location', v); }, [updateParams]);
  const setClientFilter = useCallback((v: string) => { setClientFilterLocal(v); updateParams('client', v); }, [updateParams]);
  const setCategoryFilter = useCallback((v: string) => { setCategoryFilterLocal(v); updateParams('category', v); }, [updateParams]);
  const setSortBy = useCallback((v: PublicJobSortOption) => { setSortByLocal(v); updateParams('sort', v === 'recent' ? '' : v); }, [updateParams]);

  // Debounce search term for API calls (300ms)
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

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
    searchTerm: debouncedSearchTerm,
    locationFilter,
    clientFilter,
    categoryFilter,
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
    staleTime: 1000 * 60 * 5,
  });

  // Fetch distinct locations server-side
  const { data: serverLocations } = useQuery({
    queryKey: [...queryKeys.public.all, 'locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_listings')
        .select('city, state, location')
        .eq('status', 'active')
        .eq('is_hidden', false);

      if (error) throw error;

      const locationSet = new Set<string>();
      (data || []).forEach((row: any) => {
        if (row.city && row.state) {
          locationSet.add(`${row.city}, ${row.state}`);
        }
        if (row.location) {
          locationSet.add(row.location);
        }
      });
      return Array.from(locationSet).sort();
    },
    staleTime: 1000 * 60 * 5,
  });

  // Fetch job categories
  const { data: allCategories } = useQuery({
    queryKey: [...queryKeys.public.all, 'categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_categories')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return (data || []) as PublicCategoryOption[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const locations = useMemo(() => serverLocations || [], [serverLocations]);
  const clients = useMemo(() => allClients || [], [allClients]);
  const categories = useMemo(() => allCategories || [], [allCategories]);

  return {
    searchTerm,
    setSearchTerm,
    locationFilter,
    setLocationFilter,
    clientFilter,
    setClientFilter,
    categoryFilter,
    setCategoryFilter,
    sortBy,
    setSortBy,

    jobs,
    totalCount,
    locations,
    clients,
    categories,

    isLoading,
    isFetchingMore,
    hasMore,
    error: error as Error | null,

    loadMore
  };
}
