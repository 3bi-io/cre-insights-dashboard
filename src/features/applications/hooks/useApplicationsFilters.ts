import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface ApplicationsFiltersState {
  searchTerm: string;
  statusFilter: string;
  categoryFilter: string;
  sourceFilter: string;
  organizationFilter: string;
  clientFilter: string;
}

export function useApplicationsFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize from URL params
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || 'all');
  const [sourceFilter, setSourceFilter] = useState(searchParams.get('source') || 'all');
  const [organizationFilter, setOrganizationFilter] = useState(searchParams.get('org') || 'all');
  const [clientFilter, setClientFilter] = useState(searchParams.get('client') || 'all');

  // Sync filters with URL
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (searchTerm) params.set('search', searchTerm);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (categoryFilter !== 'all') params.set('category', categoryFilter);
    if (sourceFilter !== 'all') params.set('source', sourceFilter);
    if (organizationFilter !== 'all') params.set('org', organizationFilter);
    if (clientFilter !== 'all') params.set('client', clientFilter);
    
    setSearchParams(params, { replace: true });
  }, [searchTerm, statusFilter, categoryFilter, sourceFilter, organizationFilter, clientFilter, setSearchParams]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setSourceFilter('all');
    setOrganizationFilter('all');
    setClientFilter('all');
    setSearchParams({}, { replace: true });
  };

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    sourceFilter,
    setSourceFilter,
    organizationFilter,
    setOrganizationFilter,
    clientFilter,
    setClientFilter,
    clearFilters,
  };
}
