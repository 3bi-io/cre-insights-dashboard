import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export const useJobs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  // Get route filter parameters from URL
  const routeFilter = {
    origin_city: searchParams.get('origin_city'),
    origin_state: searchParams.get('origin_state'),
    dest_city: searchParams.get('dest_city'),
    dest_state: searchParams.get('dest_state')
  };

  const hasRouteFilter = Object.values(routeFilter).some(value => value !== null);

  const { data: jobListings, isLoading, refetch } = useQuery({
    queryKey: ['job-listings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_listings')
        .select(`
          *,
          platforms:platform_id(name),
          job_categories:category_id(name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const filteredJobs = jobListings?.filter(job => {
    // Apply text search filter
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply route filter if present
    const matchesRoute = !hasRouteFilter || (
      job.city === routeFilter.origin_city &&
      job.state === routeFilter.origin_state &&
      job.dest_city === routeFilter.dest_city &&
      job.dest_state === routeFilter.dest_state
    );
    
    return matchesSearch && matchesRoute;
  });

  const clearRouteFilter = () => {
    setSearchParams({});
  };

  return {
    searchTerm,
    setSearchTerm,
    jobListings,
    filteredJobs,
    isLoading,
    refetch,
    routeFilter,
    hasRouteFilter,
    clearRouteFilter
  };
};