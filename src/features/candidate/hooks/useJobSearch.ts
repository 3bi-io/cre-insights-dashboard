import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import debounce from '@/lib/debounce';

export interface JobSearchFilters {
  searchTerm: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  datePosted: string;
  remoteType: string;
  salaryMin: number | null;
  salaryMax: number | null;
}

const defaultFilters: JobSearchFilters = {
  searchTerm: '',
  location: '',
  jobType: '',
  experienceLevel: '',
  datePosted: '',
  remoteType: '',
  salaryMin: null,
  salaryMax: null,
};

export const useJobSearch = () => {
  const [filters, setFilters] = useState<JobSearchFilters>(defaultFilters);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Debounced search term update
  const debouncedSetSearch = useMemo(
    () => debounce((term: string) => setDebouncedSearchTerm(term), 300),
    []
  );

  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['job-search', { ...filters, searchTerm: debouncedSearchTerm }, page],
    queryFn: async () => {
      let query = supabase
        .from('job_listings')
        .select(`
          *,
          organizations!inner(
            name,
            logo_url
          )
        `)
        .eq('status', 'active')
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      // Search term filter
      if (debouncedSearchTerm) {
        query = query.or(`title.ilike.%${debouncedSearchTerm}%,job_title.ilike.%${debouncedSearchTerm}%,job_summary.ilike.%${debouncedSearchTerm}%`);
      }

      // Location filter
      if (filters.location) {
        query = query.or(`city.ilike.%${filters.location}%,state.ilike.%${filters.location}%,location.ilike.%${filters.location}%`);
      }

      // Job type filter
      if (filters.jobType) {
        query = query.eq('job_type', filters.jobType);
      }

      // Experience level filter
      if (filters.experienceLevel) {
        query = query.eq('experience_level', filters.experienceLevel);
      }

      // Remote type filter
      if (filters.remoteType) {
        query = query.eq('remote_type', filters.remoteType);
      }

      // Date posted filter
      if (filters.datePosted) {
        const now = new Date();
        let dateThreshold: Date;
        switch (filters.datePosted) {
          case '24h':
            dateThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case 'week':
            dateThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            dateThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            dateThreshold = new Date(0);
        }
        query = query.gte('created_at', dateThreshold.toISOString());
      }

      // Salary filter
      if (filters.salaryMin) {
        query = query.gte('salary_min', filters.salaryMin);
      }
      if (filters.salaryMax) {
        query = query.lte('salary_max', filters.salaryMax);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    },
  });

  const updateFilters = useCallback((newFilters: Partial<JobSearchFilters>) => {
    setFilters(prev => {
      const updated = { ...prev, ...newFilters };
      if ('searchTerm' in newFilters) {
        debouncedSetSearch(newFilters.searchTerm || '');
      }
      return updated;
    });
    setPage(1); // Reset to first page on filter change
  }, [debouncedSetSearch]);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
    setDebouncedSearchTerm('');
    setPage(1);
  }, []);

  const loadMore = useCallback(() => {
    setPage(p => p + 1);
  }, []);

  const hasActiveFilters = Boolean(
    filters.location ||
    filters.jobType ||
    filters.experienceLevel ||
    filters.datePosted ||
    filters.remoteType ||
    filters.salaryMin ||
    filters.salaryMax
  );

  const activeFilterCount = [
    filters.location,
    filters.jobType,
    filters.experienceLevel,
    filters.datePosted,
    filters.remoteType,
    filters.salaryMin || filters.salaryMax,
  ].filter(Boolean).length;

  return {
    jobs,
    isLoading,
    error,
    filters,
    updateFilters,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
    page,
    loadMore,
    hasMore: jobs?.length === pageSize,
  };
};
