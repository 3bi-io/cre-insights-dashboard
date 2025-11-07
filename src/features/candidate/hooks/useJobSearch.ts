import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface JobSearchFilters {
  searchTerm: string;
  location: string;
  jobType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  remote: boolean;
}

export const useJobSearch = () => {
  const [filters, setFilters] = useState<JobSearchFilters>({
    searchTerm: '',
    location: '',
    jobType: '',
    salaryMin: null,
    salaryMax: null,
    remote: false,
  });

  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['job-search', filters],
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
        .order('created_at', { ascending: false });

      // Search term filter
      if (filters.searchTerm) {
        query = query.or(`title.ilike.%${filters.searchTerm}%,job_title.ilike.%${filters.searchTerm}%,job_summary.ilike.%${filters.searchTerm}%`);
      }

      // Location filter
      if (filters.location) {
        query = query.or(`city.ilike.%${filters.location}%,state.ilike.%${filters.location}%,location.ilike.%${filters.location}%`);
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

  const updateFilters = (newFilters: Partial<JobSearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      location: '',
      jobType: '',
      salaryMin: null,
      salaryMax: null,
      remote: false,
    });
  };

  return {
    jobs,
    isLoading,
    error,
    filters,
    updateFilters,
    clearFilters,
  };
};
