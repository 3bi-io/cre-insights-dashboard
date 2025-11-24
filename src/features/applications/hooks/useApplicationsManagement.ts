import { useState, useMemo } from 'react';
import { usePaginatedApplications } from './usePaginatedApplications';
import { getStatusCounts, getCategoryCounts } from '@/utils/applicationHelpers';
import { generateApplicationsPDF } from '@/utils/pdfGenerator';
import type { Application } from '@/types/common.types';
import { useAuth } from '@/hooks/useAuth';

export interface ApplicationsManagementFilters {
  searchTerm: string;
  statusFilter: string;
  categoryFilter: string;
  sourceFilter: string;
  organizationFilter: string;
  clientFilter: string;
}

export type ViewMode = 'grid' | 'table';

export const useApplicationsManagement = (hasAccess: boolean, isOrgAdmin: boolean) => {
  const { organization } = useAuth();
  
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [organizationFilter, setOrganizationFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Build filters for pagination
  const paginationFilters = useMemo(() => {
    return {
      // For org admins, RLS automatically scopes to their organization
      // For super admins, we only apply org filter if explicitly selected
      organizationId: !isOrgAdmin && organizationFilter !== 'all' 
        ? organizationFilter 
        : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      search: searchTerm || undefined,
    };
  }, [isOrgAdmin, organizationFilter, statusFilter, searchTerm]);

  // Paginated applications data
  const {
    data,
    isLoading: loading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePaginatedApplications(paginationFilters);

  // Flatten paginated data
  const applications = useMemo(() => {
    return data?.pages.flatMap(page => page.data) || [];
  }, [data]);

  const totalCount = data?.pages[0]?.totalCount || 0;

  // Client-side filtering for category and source (not in DB query)
  const filteredApplications = useMemo(() => {
    let filtered = applications;
    
    // Category filtering by category_id
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(app => 
        app.job_listings?.category_id === categoryFilter
      );
    }
    
    // Source filtering
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(app => app.source === sourceFilter);
    }
    
    // Client filtering
    if (clientFilter !== 'all') {
      filtered = filtered.filter(app => 
        app.job_listings?.client_id === clientFilter
      );
    }
    
    return filtered;
  }, [applications, categoryFilter, sourceFilter, clientFilter]);

  // Statistics
  const statusCounts = useMemo(() => getStatusCounts(filteredApplications), [filteredApplications]);
  const categoryCounts = useMemo(() => getCategoryCounts(filteredApplications), [filteredApplications]);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedApplications(new Set(filteredApplications.map(app => app.id)));
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

  // Bulk actions - Note: updateApplication not available from paginated hook
  // This will need to be passed in from parent component
  const handleBulkStatusChange = async (
    newStatus: 'pending' | 'reviewed' | 'interviewing' | 'hired' | 'rejected',
    updateFn: (id: string, data: any) => void
  ) => {
    const promises = Array.from(selectedApplications).map(id =>
      updateFn(id, { status: newStatus })
    );
    await Promise.all(promises);
    setSelectedApplications(new Set());
  };

  // Export functions
  const handleExportPDF = async () => {
    await generateApplicationsPDF(filteredApplications);
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Status', 'Source', 'Applied Date', 'Job Title'];
    const rows = filteredApplications.map(app => [
      `${app.first_name || ''} ${app.last_name || ''}`,
      app.applicant_email || '',
      app.phone || '',
      app.status || '',
      app.source || '',
      app.applied_at ? new Date(app.applied_at).toLocaleDateString() : '',
      app.job_listings?.title || app.job_listings?.job_title || ''
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applications-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return {
    // Data
    applications: filteredApplications,
    loading,
    error,
    statusCounts,
    categoryCounts,
    totalCount,
    
    // Pagination
    hasNextPage,
    isFetchingNextPage,
    loadMore: fetchNextPage,
    
    // Filters
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
    
    // View mode
    viewMode,
    setViewMode,
    
    // Selection
    selectedApplications,
    handleSelectAll,
    handleSelectApplication,
    clearSelection: () => setSelectedApplications(new Set()),
    
    // Actions
    handleBulkStatusChange,
    handleExportPDF,
    handleExportCSV,
  };
};
