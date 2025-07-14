
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

  const { data: jobListings, isLoading, refetch, error } = useQuery({
    queryKey: ['job-listings'],
    queryFn: async () => {
      console.log('Fetching job listings...');
      
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user?.id);
      
      if (!user) {
        console.log('No authenticated user found');
        return [];
      }
      
      const { data, error } = await supabase
        .from('job_listings')
        .select(`
          *,
          platforms:platform_id(name),
          job_categories:category_id(name),
          clients:client_id(name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching job listings:', error);
        throw error;
      }
      
      console.log('Job listings fetched successfully:', data?.length || 0);
      console.log('Sample job listing:', data?.[0]);
      return data || [];
    },
    retry: 2,
    retryDelay: 1000,
  });

  const filteredJobs = jobListings?.filter(job => {
    // Apply text search filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      job.title?.toLowerCase().includes(searchLower) ||
      job.job_title?.toLowerCase().includes(searchLower) ||
      job.location?.toLowerCase().includes(searchLower) ||
      job.city?.toLowerCase().includes(searchLower) ||
      job.state?.toLowerCase().includes(searchLower) ||
      job.clients?.name?.toLowerCase().includes(searchLower) ||
      job.client?.toLowerCase().includes(searchLower) ||
      job.platforms?.name?.toLowerCase().includes(searchLower) ||
      job.job_categories?.name?.toLowerCase().includes(searchLower);
    
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
    error,
    refetch,
    routeFilter,
    hasRouteFilter,
    clearRouteFilter
  };
};
