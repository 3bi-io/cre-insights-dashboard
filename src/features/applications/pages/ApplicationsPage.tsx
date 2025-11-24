import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LayoutGrid, Table as TableIcon } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Progress } from '@/components/ui/progress';

import { PageLayout } from '@/features/shared';
import { useApplications } from '../hooks/useApplications';
import { useApplicationDialogs } from '../hooks/useApplicationDialogs';
import { useOrganizationData } from '../hooks/useOrganizationData';
import { useApplicationsFilters } from '../hooks/useApplicationsFilters';
import { useApplicationsExport } from '../hooks/useApplicationsExport';
import { useApplicationsBulkActions } from '../hooks/useApplicationsBulkActions';
import { getStatusCounts, getCategoryCounts, getApplicantCategory } from '@/utils/applicationHelpers';
import { useIsMobile } from '@/hooks/use-mobile';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

import {
  ApplicationDetailsDialog,
  TenstreetUpdateDialog,
  TenstreetUpdateModal,
  SmsConversationDialog,
  ApplicationsOverview,
  ApplicationsSearch,
  ApplicationCard,
  ApplicationsTableView,
  ApplicationsActions,
  KeyboardShortcutsHint
} from '../components';
import { TableColumnVisibility, ColumnVisibility } from '../components/TableColumnVisibility';
import ScreeningRequestsDialog from '@/components/applications/ScreeningRequestsDialog';

const ApplicationsPage = () => {
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    applicant: true,
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
  
  const {
    selectedApplication,
    smsDialogOpen,
    detailsDialogOpen,
    tenstreetModalOpen,
    screeningDialogOpen,
    handleSmsOpen,
    handleDetailsView,
    handleTenstreetUpdate,
    handleScreeningOpen,
    closeSmsDialog,
    closeDetailsDialog,
    closeTenstreetModal,
    closeScreeningDialog,
  } = useApplicationDialogs();

  const {
    applications: serverFilteredApplications,
    loading,
    error,
    totalCount,
    hasMore,
    loadMore,
    createApplication,
    updateApplication,
    deleteApplication,
    refresh,
  } = useApplications({
    enabled: true,
    filters: {
      search: filters.searchTerm,
      organization_id: isOrgAdmin && filters.organizationFilter === 'all' 
        ? undefined 
        : filters.organizationFilter !== 'all' 
          ? filters.organizationFilter 
          : undefined,
    }
  });

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

  // Client-side filtering for category and source
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
      handler: () => exportApplications(applications, 'csv'),
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

  // Calculate counts from applications (server-side filtered)
  const statusCounts = getStatusCounts(applications || []);
  const categoryCounts = getCategoryCounts(applications || []);

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

  const pageActions = (
    <div className="flex items-center gap-2 flex-wrap">
      <ToggleGroup 
        type="single" 
        value={viewMode} 
        onValueChange={(value) => value && setViewMode(value as 'card' | 'table')}
        className="border border-input rounded-md p-1 bg-background"
      >
        <ToggleGroupItem value="card" aria-label="Card view" variant="outline">
          <LayoutGrid className="w-4 h-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="table" aria-label="Table view" variant="outline">
          <TableIcon className="w-4 h-4" />
        </ToggleGroupItem>
      </ToggleGroup>
      
      {viewMode === 'table' && (
        <TableColumnVisibility
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={handleColumnVisibilityChange}
        />
      )}
      
      <ApplicationsActions
        selectedCount={selectionCount}
        onExportPDF={() => exportApplications(applications, 'pdf')}
        onExportCSV={() => exportApplications(applications, 'csv')}
        onBulkStatusChange={handleBulkStatusChange}
        onBulkDelete={async () => {
          await handleBulkDelete(async (id) => deleteApplication(id));
        }}
        onBulkExportSelected={() => {
          const selectedApps = applications.filter(app => selectedApplications.has(app.id));
          exportApplications(selectedApps, 'xlsx');
        }}
        onClearSelection={clearSelection}
      />
    </div>
  );

  if (loading) {
    return (
      <PageLayout title="Applications" description="Track and manage job applications">
        <div className="p-6 max-w-7xl mx-auto">
          <div className="space-y-6 animate-fade-in">
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 bg-gradient-to-r from-primary/20 to-primary/5 rounded animate-pulse"></div>
                      <div className="h-8 bg-gradient-to-r from-primary/10 to-transparent rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full"></div>
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-gradient-to-r from-primary/20 to-transparent rounded w-1/3"></div>
                        <div className="h-3 bg-gradient-to-r from-primary/10 to-transparent rounded w-1/2"></div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="h-3 bg-gradient-to-r from-primary/10 to-transparent rounded"></div>
                          <div className="h-3 bg-gradient-to-r from-primary/10 to-transparent rounded"></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

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
      <div className={`${isMobile ? 'p-4' : 'p-6'} max-w-7xl mx-auto`}>
        <div className="space-y-6">
          <Card className="border-border/40 bg-card/50 backdrop-blur-sm animate-fade-in">
            <CardContent className="p-6">
              <ApplicationsOverview 
                statusCounts={statusCounts} 
                categoryCounts={categoryCounts} 
              />
            </CardContent>
          </Card>
          
          <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <ApplicationsSearch
              searchTerm={filters.searchTerm}
              categoryFilter={filters.categoryFilter}
              sourceFilter={filters.sourceFilter}
              organizationFilter={filters.organizationFilter}
              onSearchChange={setSearchTerm}
              onCategoryChange={setCategoryFilter}
              onSourceChange={setSourceFilter}
              onOrganizationChange={setOrganizationFilter}
              showOrganizationFilter={isSuperAdmin}
              organizations={organizations}
            />
          </div>
          
          {/* Keyboard Shortcuts Hint */}
          <KeyboardShortcutsHint />

          {/* Bulk Action Progress */}
          {bulkProgress.status === 'processing' && (
            <Card className="border-primary/50 bg-primary/5 animate-fade-in">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Processing bulk action...</span>
                    <span className="text-muted-foreground">{bulkProgress.current}/{bulkProgress.total}</span>
                  </div>
                  <Progress value={bulkProgress.percentage} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {applications && applications.length > 0 ? (
              viewMode === 'card' ? (
                applications.map((application, index) => (
                  <div 
                    key={application.id || index}
                    className="animate-fade-in"
                    style={{ animationDelay: `${(index % 10) * 50}ms` }}
                  >
                    <ApplicationCard
                      application={application}
                      onStatusChange={(applicationId, newStatus) => updateApplication(applicationId, { status: newStatus as 'pending' | 'reviewed' | 'interviewing' | 'hired' | 'rejected' })}
                      onRecruiterAssignment={(applicationId, recruiterId) => {
                        logger.debug('Recruiter assignment requested', { applicationId, recruiterId }, 'Applications');
                      }}
                      onDetailsView={() => handleDetailsView(application)}
                      onSmsOpen={() => handleSmsOpen(application)}
                      onScreeningOpen={() => handleScreeningOpen(application)}
                      onTenstreetUpdate={() => handleTenstreetUpdate(application)}
                    />
                  </div>
                ))
              ) : (
                <ApplicationsTableView
                  applications={applications}
                  selectedApplications={selectedApplications}
                  columnVisibility={columnVisibility}
                  onStatusChange={(applicationId, newStatus) => updateApplication(applicationId, { status: newStatus as 'pending' | 'reviewed' | 'interviewing' | 'hired' | 'rejected' })}
                  onRecruiterAssignment={(applicationId, recruiterId) => {
                    logger.debug('Recruiter assignment requested', { applicationId, recruiterId }, 'Applications');
                  }}
                  onDetailsView={handleDetailsView}
                  onSmsOpen={handleSmsOpen}
                  onScreeningOpen={handleScreeningOpen}
                  onTenstreetUpdate={handleTenstreetUpdate}
                  onSelectApplication={handleSelectApplication}
                  onSelectAll={(checked) => handleSelectAll(checked, applications.map(a => a.id))}
                />
              )
            ) : (
              <Card className="border-border/40 bg-card/50 backdrop-blur-sm animate-fade-in">
                <CardContent className="p-16 text-center">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-primary/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium text-foreground mb-2">No applications found</p>
                  <p className="text-muted-foreground">
                    {loading ? "Loading applications..." : "Try adjusting your filters or check back later"}
                  </p>
                </CardContent>
              </Card>
            )}
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

        {/* Enhanced Dialogs */}
        {selectedApplication && (
          <>
            <SmsConversationDialog
              application={selectedApplication}
              open={smsDialogOpen}
              onOpenChange={closeSmsDialog}
            />
            
            <ApplicationDetailsDialog
              application={selectedApplication}
              isOpen={detailsDialogOpen}
              onClose={closeDetailsDialog}
            />
            
            <ScreeningRequestsDialog
              application={selectedApplication}
              open={screeningDialogOpen}
              onOpenChange={closeScreeningDialog}
            />
            
            <TenstreetUpdateModal
              application={selectedApplication}
              isOpen={tenstreetModalOpen}
              onClose={closeTenstreetModal}
            />
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default ApplicationsPage;