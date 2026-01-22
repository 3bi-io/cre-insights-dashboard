/**
 * useApplicationsManagement Hook
 * 
 * UI state management for applications list.
 * Does NOT fetch data - use usePaginatedApplications for data fetching.
 * This hook handles filters, selection, view mode, and export actions.
 */

import { useState, useMemo } from 'react';
import { getStatusCounts, getCategoryCounts } from '@/utils/applicationHelpers';
import { generateApplicationsPDF } from '@/utils/pdfGenerator';
import type { Application } from '@/types/common.types';

export type ViewMode = 'grid' | 'table' | 'kanban';

export interface ApplicationsManagementConfig {
  /** Whether user is an org admin (affects filter behavior) */
  isOrgAdmin: boolean;
}

export interface ApplicationsUIState {
  searchTerm: string;
  statusFilter: string;
  categoryFilter: string;
  sourceFilter: string;
  organizationFilter: string;
  clientFilter: string;
  viewMode: ViewMode;
  selectedApplications: Set<string>;
}

/**
 * UI state management hook for applications.
 * 
 * @param config - Configuration options
 * @returns UI state and handlers
 */
export const useApplicationsManagement = (config: ApplicationsManagementConfig) => {
  const { isOrgAdmin } = config;
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [organizationFilter, setOrganizationFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  
  // Selection state
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set());
  
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  /**
   * Build filters for usePaginatedApplications query
   */
  const paginationFilters = useMemo(() => ({
    // For org admins, RLS automatically scopes to their organization
    // For super admins, we only apply org filter if explicitly selected
    organizationId: !isOrgAdmin && organizationFilter !== 'all' 
      ? organizationFilter 
      : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    search: searchTerm || undefined,
  }), [isOrgAdmin, organizationFilter, statusFilter, searchTerm]);

  /**
   * Apply client-side filters to applications
   * (category, source, client are not in the DB query)
   */
  const applyClientSideFilters = (applications: Application[]) => {
    let filtered = applications;
    
    // Category filtering by category_id
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(app => 
        (app as any).job_listings?.category_id === categoryFilter
      );
    }
    
    // Source filtering
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(app => app.source === sourceFilter);
    }
    
    // Client filtering
    if (clientFilter !== 'all') {
      filtered = filtered.filter(app => 
        (app as any).job_listings?.client_id === clientFilter
      );
    }
    
    return filtered;
  };

  /**
   * Calculate statistics for a given application list
   */
  const calculateStats = (applications: Application[]) => ({
    statusCounts: getStatusCounts(applications),
    categoryCounts: getCategoryCounts(applications),
  });

  // Selection handlers
  const handleSelectAll = (applications: Application[], checked: boolean) => {
    if (checked) {
      setSelectedApplications(new Set(applications.map(app => app.id)));
    } else {
      setSelectedApplications(new Set());
    }
  };

  const handleSelectApplication = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedApplications);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedApplications(newSelected);
  };

  const clearSelection = () => setSelectedApplications(new Set());

  // Bulk actions
  const handleBulkStatusChange = async (
    newStatus: 'pending' | 'reviewed' | 'interviewing' | 'hired' | 'rejected',
    updateFn: (id: string, data: any) => void
  ) => {
    const promises = Array.from(selectedApplications).map(id =>
      updateFn(id, { status: newStatus })
    );
    await Promise.all(promises);
    clearSelection();
  };

  // Export functions
  const handleExportPDF = async (applications: Application[]) => {
    await generateApplicationsPDF(applications);
  };

  const handleExportCSV = (applications: Application[]) => {
    const headers = ['Name', 'Email', 'Phone', 'Status', 'Source', 'Applied Date', 'Job Title'];
    const rows = applications.map(app => [
      `${app.first_name || ''} ${app.last_name || ''}`,
      app.applicant_email || '',
      app.phone || '',
      app.status || '',
      app.source || '',
      app.applied_at ? new Date(app.applied_at).toLocaleDateString() : '',
      (app as any).job_listings?.title || (app as any).job_listings?.job_title || ''
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applications-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setSourceFilter('all');
    setOrganizationFilter('all');
    setClientFilter('all');
  };

  return {
    // Filters (for usePaginatedApplications)
    paginationFilters,
    
    // Filter state & setters
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
    resetFilters,
    
    // View mode
    viewMode,
    setViewMode,
    
    // Selection
    selectedApplications,
    handleSelectAll,
    handleSelectApplication,
    clearSelection,
    
    // Client-side filtering & stats (apply to fetched data)
    applyClientSideFilters,
    calculateStats,
    
    // Actions (require applications as parameter)
    handleBulkStatusChange,
    handleExportPDF,
    handleExportCSV,
  };
};

export default useApplicationsManagement;
