/**
 * Consolidated Application Filters Hook
 * Manages all filter state with URL query params support
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ApplicationStatus } from '@/types/api.types';

export interface ApplicationsFiltersState {
  searchTerm: string;
  statusFilter: ApplicationStatus | 'all';
  categoryFilter: string;
  sourceFilter: string;
  organizationFilter: string;
  clientFilter: string;
}

export const useApplicationsFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize state from URL params
  const [filters, setFilters] = useState<ApplicationsFiltersState>({
    searchTerm: searchParams.get('search') || '',
    statusFilter: (searchParams.get('status') as ApplicationStatus) || 'all',
    categoryFilter: searchParams.get('category') || 'all',
    sourceFilter: searchParams.get('source') || 'all',
    organizationFilter: searchParams.get('org') || 'all',
    clientFilter: searchParams.get('client') || 'all',
  });

  // Sync filters with URL params
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (filters.searchTerm) params.set('search', filters.searchTerm);
    if (filters.statusFilter !== 'all') params.set('status', filters.statusFilter);
    if (filters.categoryFilter !== 'all') params.set('category', filters.categoryFilter);
    if (filters.sourceFilter !== 'all') params.set('source', filters.sourceFilter);
    if (filters.organizationFilter !== 'all') params.set('org', filters.organizationFilter);
    if (filters.clientFilter !== 'all') params.set('client', filters.clientFilter);

    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const setSearchTerm = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, searchTerm: value }));
  }, []);

  const setStatusFilter = useCallback((value: ApplicationStatus | 'all') => {
    setFilters(prev => ({ ...prev, statusFilter: value }));
  }, []);

  const setCategoryFilter = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, categoryFilter: value }));
  }, []);

  const setSourceFilter = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, sourceFilter: value }));
  }, []);

  const setOrganizationFilter = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, organizationFilter: value }));
  }, []);

  const setClientFilter = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, clientFilter: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      statusFilter: 'all',
      categoryFilter: 'all',
      sourceFilter: 'all',
      organizationFilter: 'all',
      clientFilter: 'all',
    });
  }, []);

  const hasActiveFilters = 
    filters.searchTerm !== '' ||
    filters.statusFilter !== 'all' ||
    filters.categoryFilter !== 'all' ||
    filters.sourceFilter !== 'all' ||
    filters.organizationFilter !== 'all' ||
    filters.clientFilter !== 'all';

  return {
    filters,
    setSearchTerm,
    setStatusFilter,
    setCategoryFilter,
    setSourceFilter,
    setOrganizationFilter,
    setClientFilter,
    clearFilters,
    hasActiveFilters,
  };
};
