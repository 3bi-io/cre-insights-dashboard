
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useJobs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [organizationFilter, setOrganizationFilter] = useState('all');
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { organization, userRole } = useAuth();

  // Check if super admin is on admin jobs page
  const isAdminJobsPage = location.pathname === '/admin/jobs';
  const isSuperAdmin = userRole === 'super_admin';
  const showAllOrganizations = isSuperAdmin && isAdminJobsPage;

  // Get route filter parameters from URL
  const routeFilter = {
    origin_city: searchParams.get('origin_city'),
    origin_state: searchParams.get('origin_state'),
    dest_city: searchParams.get('dest_city'),
    dest_state: searchParams.get('dest_state')
  };

  // Get client filter from URL
  const clientFilter = searchParams.get('client');

  const hasRouteFilter = Object.values(routeFilter).some(value => value !== null);
  const hasClientFilter = Boolean(clientFilter);

  // Set search term based on client filter
  useEffect(() => {
    if (clientFilter && !searchTerm) {
      setSearchTerm(clientFilter);
    }
  }, [clientFilter, searchTerm]);

  const { data: jobListings, isLoading, refetch, error } = useQuery({
    queryKey: ['job-listings', showAllOrganizations ? 'all' : organization?.id],
    queryFn: async () => {
      console.log('Fetching job listings...', showAllOrganizations ? 'for all organizations' : 'for current organization');
      
      // Build the query
      let query = supabase
        .from('job_listings')
        .select(`
          *,
          job_platform_associations(
            platforms(
              id,
              name
            )
          ),
          job_categories:category_id(name),
          clients:client_id(name),
          organizations:organization_id(name, slug)
        `);

      // Only filter by organization if not showing all organizations
      if (!showAllOrganizations && organization?.id) {
        query = query.eq('organization_id', organization.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
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
    enabled: showAllOrganizations || !!organization?.id, // Run for super admins or when organization is available
  });

  const filteredJobs = jobListings?.filter(job => {
    // Apply text search filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      job.title?.toLowerCase().includes(searchLower) ||
      job.job_title?.toLowerCase().includes(searchLower) ||
      job.job_summary?.toLowerCase().includes(searchLower) ||
      
      job.location?.toLowerCase().includes(searchLower) ||
      job.city?.toLowerCase().includes(searchLower) ||
      job.state?.toLowerCase().includes(searchLower) ||
      job.clients?.name?.toLowerCase().includes(searchLower) ||
      job.client?.toLowerCase().includes(searchLower) ||
      job.job_platform_associations?.some(assoc => 
        assoc.platforms?.name?.toLowerCase().includes(searchLower)
      ) ||
      job.job_categories?.name?.toLowerCase().includes(searchLower);
    
    // Apply route filter if present
    const matchesRoute = !hasRouteFilter || (
      job.city === routeFilter.origin_city &&
      job.state === routeFilter.origin_state &&
      job.dest_city === routeFilter.dest_city &&
      job.dest_state === routeFilter.dest_state
    );

    // Apply organization filter if present (for super admins)
    const matchesOrganization = organizationFilter === 'all' || 
      job.organization_id === organizationFilter;
    
    return matchesSearch && matchesRoute && matchesOrganization;
  });

  const clearRouteFilter = () => {
    setSearchParams({});
  };

  const clearClientFilter = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('client');
    setSearchParams(newParams);
    setSearchTerm('');
  };

  return {
    searchTerm,
    setSearchTerm,
    organizationFilter,
    setOrganizationFilter,
    jobListings,
    filteredJobs,
    isLoading,
    error,
    refetch,
    routeFilter,
    hasRouteFilter,
    clearRouteFilter,
    clientFilter,
    hasClientFilter,
    clearClientFilter,
    showAllOrganizations
  };
};
