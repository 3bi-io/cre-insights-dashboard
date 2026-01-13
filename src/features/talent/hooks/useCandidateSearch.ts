import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Application } from '@/types/common.types';

export interface CandidateSearchFilters {
  search: string;
  city: string;
  state: string;
  cdl: string;
  minExperience: string;
  status: string;
  source: string;
}

const DEFAULT_FILTERS: CandidateSearchFilters = {
  search: '',
  city: '',
  state: '',
  cdl: '',
  minExperience: '',
  status: '',
  source: '',
};

async function searchCandidates(filters: CandidateSearchFilters): Promise<Application[]> {
  let query = supabase
    .from('applications')
    .select(`
      *,
      job_listings(id, title, organization_id)
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  // Apply filters
  if (filters.search) {
    query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,applicant_email.ilike.%${filters.search}%`);
  }
  if (filters.city) {
    query = query.ilike('city', `%${filters.city}%`);
  }
  if (filters.state) {
    query = query.ilike('state', `%${filters.state}%`);
  }
  if (filters.cdl && filters.cdl !== 'any') {
    query = query.eq('cdl', filters.cdl);
  }
  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters.source && filters.source !== 'all') {
    query = query.eq('source', filters.source);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []) as Application[];
}

export function useCandidateSearch() {
  const [filters, setFilters] = useState<CandidateSearchFilters>(DEFAULT_FILTERS);
  const [isSearching, setIsSearching] = useState(false);

  const searchQuery = useQuery({
    queryKey: ['candidate-search', filters],
    queryFn: () => searchCandidates(filters),
    enabled: isSearching || Object.values(filters).some(v => v !== ''),
  });

  const updateFilter = <K extends keyof CandidateSearchFilters>(
    key: K,
    value: CandidateSearchFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const triggerSearch = () => {
    setIsSearching(true);
  };

  // Get unique values for filter dropdowns
  const filterOptions = useMemo(() => {
    const candidates = searchQuery.data || [];
    return {
      states: [...new Set(candidates.map(c => c.state).filter(Boolean))].sort(),
      cities: [...new Set(candidates.map(c => c.city).filter(Boolean))].sort(),
      sources: [...new Set(candidates.map(c => c.source).filter(Boolean))].sort(),
    };
  }, [searchQuery.data]);

  return {
    candidates: searchQuery.data || [],
    isLoading: searchQuery.isLoading,
    error: searchQuery.error,
    filters,
    updateFilter,
    resetFilters,
    triggerSearch,
    filterOptions,
  };
}
