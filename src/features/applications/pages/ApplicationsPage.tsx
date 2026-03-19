import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { PageLayout } from '@/features/shared';
import { usePaginatedApplications } from '../hooks/usePaginatedApplications';
import { useApplicationsMutations } from '../hooks/useApplicationsMutations';
import { useApplicationDialogs } from '../hooks/useApplicationDialogs';
import { useOrganizationData } from '../hooks/useOrganizationData';
import { useApplicationsFilters } from '../hooks/useApplicationsFilters';
import { useApplicationsExport } from '../hooks/useApplicationsExport';
import { useApplicationsBulkActions } from '../hooks/useApplicationsBulkActions';
import { useApplicationStats } from '../hooks/useApplicationStats';
import { getApplicantCategory } from '@/utils/applicationHelpers';
import type { ApplicationStatus } from '@/types/api.types';
import { useIsMobile } from '@/hooks/use-mobile';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import { ColumnVisibility } from '../components/TableColumnVisibility';

import {
  ApplicationsOverview,
  ApplicationsSearch,
  KeyboardShortcutsHint,
  ApplicationsLoadingSkeleton,
  ApplicationsBulkProgress,
  ApplicationsDialogs,
  ApplicationsList,
  ApplicationsPageActions,
} from '../components';

const ApplicationsPage = () => {
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    applicant: true,
    formType: true,
    job: true,
    contact: true,
    location: true,
    date: true,
    status: true,
    recruiter: true,
    actions: true,
  });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const { userRole } = useAuth();

  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const isSuperAdmin = userRole === 'super_admin';
  const isOrgAdmin = userRole === 'admin' && !isSuperAdmin;

  // Consolidated hooks
  const { organizations } = useOrganizationData(isSuperAdmin);
  const {
    filters,
    setSearchTerm,
    setStatusFilter,
    setCategoryFilter,
    setSourceFilter,
    setOrganizationFilter,
    clearFilters,
    hasActiveFilters,
  } = useApplicationsFilters();
  
  const dialogState = useApplicationDialogs();

  // Build pagination filters - now includes status for server-side filtering
  const paginationFilters = React.useMemo(() => ({
    search: filters.searchTerm || undefined,
    status: filters.statusFilter !== 'all' ? filters.statusFilter : undefined,
    organizationId: isOrgAdmin && filters.organizationFilter === 'all' 
      ? undefined 
      : filters.organizationFilter !== 'all' 
        ? filters.organizationFilter 
        : undefined,
  }), [filters.searchTerm, filters.statusFilter, filters.organizationFilter, isOrgAdmin]);

  // Build stats filters - only needs org filter
  const statsFilters = React.useMemo(() => ({
    organizationId: isOrgAdmin && filters.organizationFilter === 'all' 
      ? undefined 
      : filters.organizationFilter !== 'all' 
        ? filters.organizationFilter 
        : undefined,
  }), [filters.organizationFilter, isOrgAdmin]);

  // Fetch global stats for all applications (not paginated)
  const { data: globalStats } = useApplicationStats(statsFilters);

  // Data fetching with pagination (canonical hook)
  const {
    data,
    isLoading: loading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = usePaginatedApplications(paginationFilters);

  // CRUD mutations
  const {
    updateApplication,
    deleteApplication,
    invalidateApplications,
  } = useApplicationsMutations();

  // Flatten paginated data
  const serverFilteredApplications = React.useMemo(() => {
    return data?.pages.flatMap(page => page.data) || [];
  }, [data]);

  const totalCount = data?.pages[0]?.totalCount || 0;
  const hasMore = hasNextPage || false;
  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };
  const refresh = async () => {
    await refetch();
  };

  const { exportApplications } = useApplicationsExport();

  const {
    selectedApplications,
    handleSelectAll,
    handleSelectApplication,
    clearSelection,
    handleBulkStatusChange,
    handleBulkDelete,
    bulkProgress,
    hasSelection,
    selectionCount,
  } = useApplicationsBulkActions({ 
    updateApplication: async (id, data) => updateApplication(id, data),
    refresh 
  });

  // Client-side filtering for category and source (status is now server-side)
  const applications = React.useMemo(() => {
    if (!serverFilteredApplications) return [];
    
    return serverFilteredApplications.filter(app => {
      if (filters.categoryFilter !== 'all') {
        const category = getApplicantCategory(app);
        if (category.code !== filters.categoryFilter) return false;
      }
      
      if (filters.sourceFilter !== 'all') {
        const source = app.source || 'Other';
        if (source !== filters.sourceFilter) return false;
      }
      
      return true;
    });
  }, [serverFilteredApplications, filters.categoryFilter, filters.sourceFilter]);

  // Handlers for clicking overview cards
  const handleStatusClick = useCallback((status: string) => {
    setStatusFilter(status as ApplicationStatus | 'all');
  }, [setStatusFilter]);

  const handleCategoryClick = useCallback((category: string) => {
    setCategoryFilter(category);
  }, [setCategoryFilter]);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: '/',
      ctrl: false,
      handler: () => searchInputRef.current?.focus(),
      description: 'Focus search',
    },
    {
      key: 'Escape',
      ctrl: false,
      handler: clearFilters,
      description: 'Clear filters',
    },
    {
      key: 'r',
      ctrl: true,
      handler: () => refresh(),
      description: 'Refresh',
    },
    {
      key: 'e',
      ctrl: true,
      handler: () => exportApplications(applications as any, 'csv'),
      description: 'Export',
    },
    {
      key: 'a',
      ctrl: true,
      handler: () => handleSelectAll(true, applications.map(a => a.id)),
      description: 'Select all',
    },
  ]);

  const handleColumnVisibilityChange = useCallback((column: keyof ColumnVisibility) => {
    setColumnVisibility(prev => ({
      ...prev,
      [column]: !prev[column],
    }));
  }, []);

  // Use global stats for accurate counts across all applications
  const statusCounts = globalStats?.byStatus || {};
  const categoryCounts = globalStats?.byCategory || {};
  const globalTotalCount = globalStats?.total || 0;

  // Debug logging
  logger.debug('Applications page state', {
    applicationsCount: applications?.length || 0,
    userRole,
    isAdmin,
    isOrgAdmin,
    filters,
    hasSelection,
    selectionCount,
  }, 'Applications');

  if (loading) {
    return <ApplicationsLoadingSkeleton />;
  }

  const pageActions = (
    <ApplicationsPageActions
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      columnVisibility={columnVisibility}
      onColumnVisibilityChange={handleColumnVisibilityChange}
      applications={applications as any}
      selectedApplications={selectedApplications}
      selectionCount={selectionCount}
      onExport={(format) => exportApplications(applications as any, format)}
      onBulkStatusChange={handleBulkStatusChange}
      onBulkDelete={async () => {
        await handleBulkDelete(async (id) => deleteApplication(id));
      }}
      onClearSelection={clearSelection}
    />
  );

  return (
    <PageLayout 
      title="Applications" 
      description={
        totalCount 
          ? `${isOrgAdmin ? 'Manage job applications for your organization' : 'Track and manage job applications'} (${applications.length} of ${totalCount})`
          : isOrgAdmin 
            ? "Manage job applications for your organization"
            : "Track and manage job applications"
      }
      actions={pageActions}
    >
      <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto pb-20 md:pb-6">
        <div className="space-y-6">
          <Card className="border-border/40 bg-card/50 backdrop-blur-sm animate-fade-in">
            <CardContent className="p-6">
              <ApplicationsOverview 
                statusCounts={statusCounts} 
                categoryCounts={categoryCounts}
                totalCount={globalTotalCount}
                onStatusClick={handleStatusClick}
                onCategoryClick={handleCategoryClick}
                activeStatusFilter={filters.statusFilter}
                activeCategoryFilter={filters.categoryFilter}
              />
            </CardContent>
          </Card>
          
          <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <ApplicationsSearch
              searchTerm={filters.searchTerm}
              statusFilter={filters.statusFilter}
              categoryFilter={filters.categoryFilter}
              sourceFilter={filters.sourceFilter}
              organizationFilter={filters.organizationFilter}
              onSearchChange={setSearchTerm}
              onStatusChange={(value) => setStatusFilter(value as ApplicationStatus | 'all')}
              onCategoryChange={setCategoryFilter}
              onSourceChange={setSourceFilter}
              onOrganizationChange={setOrganizationFilter}
              showOrganizationFilter={isSuperAdmin}
              organizations={organizations}
            />
          </div>
          
          {/* Hide keyboard shortcuts on mobile */}
          <div className="hidden md:block">
            <KeyboardShortcutsHint />
          </div>

          <ApplicationsBulkProgress bulkProgress={bulkProgress} />

          <div className="space-y-4">
            <ApplicationsList
              applications={applications as any}
              viewMode={viewMode}
              selectedApplications={selectedApplications}
              columnVisibility={columnVisibility}
              loading={loading}
              onStatusChange={(id, status) => updateApplication(id, { status: status as 'pending' | 'reviewed' | 'interviewing' | 'hired' | 'rejected' })}
              onRecruiterAssignment={(id, recruiterId) => {
                logger.debug('Recruiter assignment requested', { id, recruiterId }, 'Applications');
              }}
              onDetailsView={dialogState.handleDetailsView}
              onSmsOpen={dialogState.handleSmsOpen}
              onScreeningOpen={dialogState.handleScreeningOpen}
              onTenstreetUpdate={dialogState.handleTenstreetUpdate}
              onSelectApplication={handleSelectApplication}
              onSelectAll={(checked) => handleSelectAll(checked, applications.map(a => a.id))}
            />
          </div>

          {hasMore && !loading && applications && applications.length > 0 && (
            <div className="flex justify-center py-6 animate-fade-in">
              <Button 
                onClick={loadMore}
                variant="outline"
                size="lg"
                className="min-w-[200px]"
              >
                Load More Applications
              </Button>
            </div>
          )}
        </div>

        <ApplicationsDialogs
          selectedApplication={dialogState.selectedApplication}
          smsDialogOpen={dialogState.smsDialogOpen}
          detailsDialogOpen={dialogState.detailsDialogOpen}
          screeningDialogOpen={dialogState.screeningDialogOpen}
          tenstreetModalOpen={dialogState.tenstreetModalOpen}
          onCloseSms={dialogState.closeSmsDialog}
          onCloseDetails={dialogState.closeDetailsDialog}
          onCloseScreening={dialogState.closeScreeningDialog}
          onCloseTenstreet={dialogState.closeTenstreetModal}
        />
      </div>
    </PageLayout>
  );
};

export default ApplicationsPage;
