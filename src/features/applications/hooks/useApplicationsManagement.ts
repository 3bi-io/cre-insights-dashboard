import { useState, useMemo } from 'react';
import { useApplications } from './useApplications';
import { filterApplications, getStatusCounts, getCategoryCounts } from '@/utils/applicationHelpers';
import { generateApplicationsPDF } from '@/utils/pdfGenerator';
import type { Application } from '@/types/common.types';

export interface ApplicationsManagementFilters {
  searchTerm: string;
  statusFilter: string;
  categoryFilter: string;
  sourceFilter: string;
  organizationFilter: string;
}

export const useApplicationsManagement = (hasAccess: boolean, isOrgAdmin: boolean) => {
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [organizationFilter, setOrganizationFilter] = useState<string>('all');
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set());

  // Applications data with RLS-based filtering
  const {
    applications,
    loading,
    error,
    updateApplication,
    refresh,
  } = useApplications({
    enabled: hasAccess,
    filters: {
      search: searchTerm,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      organization_id: isOrgAdmin && organizationFilter === 'all' 
        ? undefined // RLS handles org scoping
        : organizationFilter !== 'all' 
          ? organizationFilter 
          : undefined,
    }
  });

  // Filtered applications
  const filteredApplications = useMemo(() => {
    return filterApplications(
      applications,
      searchTerm,
      categoryFilter,
      sourceFilter,
      organizationFilter
    );
  }, [applications, searchTerm, categoryFilter, sourceFilter, organizationFilter]);

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

  // Bulk actions
  const handleBulkStatusChange = async (newStatus: 'pending' | 'reviewed' | 'interviewing' | 'hired' | 'rejected') => {
    const promises = Array.from(selectedApplications).map(id =>
      updateApplication(id, { status: newStatus })
    );
    await Promise.all(promises);
    setSelectedApplications(new Set());
    refresh();
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
      app.job_listings?.title || ''
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
    
    // Selection
    selectedApplications,
    handleSelectAll,
    handleSelectApplication,
    clearSelection: () => setSelectedApplications(new Set()),
    
    // Actions
    updateApplication,
    handleBulkStatusChange,
    handleExportPDF,
    handleExportCSV,
    refresh,
  };
};
