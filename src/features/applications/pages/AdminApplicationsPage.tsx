import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePlatformAccess } from '@/hooks/usePlatformAccess';
import PageLayout from '@/components/PageLayout';
import { usePaginatedApplications } from '../hooks/usePaginatedApplications';
import { useApplicationsManagement } from '../hooks/useApplicationsManagement';
import { useApplicationsMutations } from '../hooks/useApplicationsMutations';
import { useOrganizationData } from '../hooks/useOrganizationData';
import { useApplicationDialogs } from '../hooks/useApplicationDialogs';
import { useClientsService } from '@/features/clients/hooks';
import { Card } from '@/components/ui/card';
import { ApplicationsStats } from '../components/ApplicationsStats';
import { ApplicationsFilters } from '../components/ApplicationsFilters';
import { ApplicationsActions } from '../components/ApplicationsActions';
import { ApplicationsGrid } from '../components/ApplicationsGrid';
import { ApplicationsTable } from '../components/ApplicationsTable';
import { KanbanBoard } from '../components';
import { ApplicationsViewSwitcher } from '../components/ApplicationsViewSwitcher';
import ApplicationDetailsDialog from '@/components/applications/ApplicationDetailsDialog';
import SmsConversationDialog from '@/components/applications/SmsConversationDialog';
import TenstreetUpdateModal from '@/components/applications/TenstreetUpdateModal';
import ScreeningRequestsDialog from '@/components/applications/ScreeningRequestsDialog';
import { Skeleton } from '@/components/ui/skeleton';
import type { Application } from '@/types/common.types';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';
import { getApplicantName, getApplicantEmail } from '@/utils/applicationHelpers';
import { writeExcelFile } from '@/lib/excelHelper';

export default function AdminApplicationsPage() {
  const { user, userRole, organization } = useAuth();
  const { checkPlatformAccess } = usePlatformAccess(organization?.id);
  const [hasAccess, setHasAccess] = useState(false);
  const { toast } = useToast();
  
  // Role detection
  const isSuperAdmin = userRole === 'super_admin';
  const isOrgAdmin = userRole === 'admin';

  // Check platform access (super admins always have access)
  useEffect(() => {
    const checkAccess = async () => {
      if (isSuperAdmin) {
        setHasAccess(true);
        return;
      }
      const access = await checkPlatformAccess('applications');
      setHasAccess(access);
    };
    checkAccess();
  }, [checkPlatformAccess, isSuperAdmin]);

  // Organization data for super admins
  const { organizations } = useOrganizationData(isSuperAdmin);

  // Fetch clients for org admins
  const { clients } = useClientsService({
    enabled: isOrgAdmin && !!organization
  });

  // UI state management (filters, selection, view mode)
  const {
    paginationFilters,
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
    viewMode,
    setViewMode,
    selectedApplications,
    handleSelectAll,
    handleSelectApplication,
    clearSelection,
    applyClientSideFilters,
    calculateStats,
    handleBulkStatusChange,
    handleExportPDF,
    handleExportCSV,
  } = useApplicationsManagement({ isOrgAdmin });

  // Data fetching with pagination (canonical hook)
  const {
    data,
    isLoading: loading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePaginatedApplications(paginationFilters);

  // CRUD mutations
  const { updateApplication, deleteApplication } = useApplicationsMutations();

  // Flatten paginated data and apply client-side filters
  const rawApplications = useMemo(() => {
    return data?.pages.flatMap(page => page.data) || [];
  }, [data]);

  const applications = useMemo(() => {
    return applyClientSideFilters(rawApplications as Application[]);
  }, [rawApplications, applyClientSideFilters]);

  const totalCount = data?.pages[0]?.totalCount || 0;
  const { statusCounts } = calculateStats(applications);

  // Dialog state management
  const {
    selectedApplication,
    smsDialogOpen,
    detailsDialogOpen,
    tenstreetModalOpen,
    handleSmsOpen,
    handleDetailsView,
    handleTenstreetUpdate,
    closeSmsDialog,
    closeDetailsDialog,
    closeTenstreetModal,
  } = useApplicationDialogs();

  // Screening dialog state
  const [screeningDialogOpen, setScreeningDialogOpen] = useState(false);
  const [screeningApplication, setScreeningApplication] = useState<Application | null>(null);

  const handleScreeningOpen = (application: Application) => {
    setScreeningApplication(application);
    setScreeningDialogOpen(true);
  };

  const closeScreeningDialog = () => {
    setScreeningDialogOpen(false);
    setScreeningApplication(null);
  };

  // Bulk actions handlers
  const handleBulkDelete = async () => {
    const selectedIds = Array.from(selectedApplications);
    try {
      await Promise.all(
        selectedIds.map(id => deleteApplication(id))
      );
      toast({
        title: "Applications Deleted",
        description: `${selectedIds.length} application(s) deleted successfully`,
      });
      clearSelection();
    } catch (error) {
      logger.error('Bulk delete error', error, 'Applications');
      toast({
        title: "Delete Failed",
        description: "Failed to delete applications",
        variant: "destructive",
      });
    }
  };

  const handleBulkExportSelected = async () => {
    try {
      const selectedApps = applications.filter(app => selectedApplications.has(app.id));
      const exportData = selectedApps.map(app => ({
        'Applicant Name': getApplicantName(app),
        'Email': getApplicantEmail(app),
        'Phone': app.phone || '',
        'Job': (app as any).job_listings?.title || (app as any).job_listings?.job_title || '',
        'Status': app.status,
        'Location': `${app.city || ''} ${app.state || ''}`.trim(),
        'Date Applied': new Date(app.applied_at).toLocaleDateString(),
        'Recruiter': (app as any).recruiters ? `${(app as any).recruiters.first_name} ${(app as any).recruiters.last_name}` : 'Unassigned',
      }));

      await writeExcelFile(
        [{ name: 'Selected Applications', data: exportData }],
        `selected-applications-${new Date().toISOString().split('T')[0]}.xlsx`,
      );

      toast({
        title: "Export Complete",
        description: `${selectedApps.length} application(s) exported successfully`,
      });
    } catch (error) {
      logger.error('Bulk export error', error, 'Applications');
      toast({
        title: "Export Failed",
        description: "Failed to export selected applications",
        variant: "destructive",
      });
    }
  };

  if (!hasAccess) {
    return (
      <PageLayout title="Access Denied">
        <Card className="p-6">
          <p className="text-muted-foreground">
            You don't have permission to access the Applications module.
          </p>
        </Card>
      </PageLayout>
    );
  }

  if (loading) {
    return (
      <PageLayout 
        title="Applications Management"
        description="Manage and track all job applications"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-12" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="Applications Management"
      description={isOrgAdmin ? "Manage job applications for your organization" : "Track and manage all job applications"}
      actions={
        <div className="flex items-center gap-3">
          <ApplicationsViewSwitcher 
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
          <ApplicationsActions
            selectedCount={selectedApplications.size}
            onExportPDF={() => handleExportPDF(applications)}
            onExportCSV={() => handleExportCSV(applications)}
            onBulkStatusChange={(status) => handleBulkStatusChange(status, updateApplication)}
            onBulkDelete={handleBulkDelete}
            onBulkExportSelected={handleBulkExportSelected}
            onClearSelection={clearSelection}
          />
        </div>
      }
    >
      <div className="space-y-6">
        {/* Statistics */}
        <ApplicationsStats
          totalCount={applications.length}
          pendingCount={statusCounts.pending || 0}
          inProgressCount={(statusCounts.reviewed || 0) + (statusCounts.interviewing || 0)}
          hiredCount={statusCounts.hired || 0}
        />

        {/* Filters */}
        <ApplicationsFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          sourceFilter={sourceFilter}
          onSourceChange={setSourceFilter}
          organizationFilter={organizationFilter}
          onOrganizationChange={setOrganizationFilter}
          organizations={organizations}
          showOrganizationFilter={isSuperAdmin}
          clientFilter={clientFilter}
          onClientChange={setClientFilter}
          clients={clients}
          showClientFilter={isOrgAdmin}
        />

        {/* Applications View - Grid, Kanban, or Table */}
        {viewMode === 'grid' ? (
          <ApplicationsGrid
            applications={applications as any}
            statusCounts={statusCounts}
            selectedApplications={selectedApplications}
            onSelectAll={(checked) => handleSelectAll(applications, checked)}
            onSelectApplication={handleSelectApplication}
            onStatusChange={(id, status) => 
              updateApplication(id, { status: status as 'pending' | 'reviewed' | 'interviewing' | 'hired' | 'rejected' })
            }
            onSmsOpen={handleSmsOpen}
            onDetailsView={handleDetailsView}
            onTenstreetUpdate={handleTenstreetUpdate}
            onScreeningOpen={handleScreeningOpen}
          />
        ) : viewMode === 'kanban' ? (
          <KanbanBoard
            applications={applications as any}
            onStatusChange={async (id, status) => {
              await updateApplication(id, { status: status as 'pending' | 'reviewed' | 'interviewing' | 'hired' | 'rejected' });
            }}
            onApplicationClick={handleDetailsView}
          />
        ) : (
          <ApplicationsTable
            applications={applications as any}
            statusCounts={statusCounts}
            selectedApplications={selectedApplications}
            onSelectAll={(checked) => handleSelectAll(applications, checked)}
            onSelectApplication={handleSelectApplication}
            onStatusChange={(id, status) => 
              updateApplication(id, { status: status as 'pending' | 'reviewed' | 'interviewing' | 'hired' | 'rejected' })
            }
            onSmsOpen={handleSmsOpen}
            onDetailsView={handleDetailsView}
            onTenstreetUpdate={handleTenstreetUpdate}
            onScreeningOpen={handleScreeningOpen}
          />
        )}

        {/* Pagination */}
        {hasNextPage && (
          <div className="flex justify-center py-8">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isFetchingNextPage ? 'Loading...' : `Load More (${totalCount - applications.length} remaining)`}
            </button>
          </div>
        )}
      </div>

      {/* Dialogs */}
      {selectedApplication && (
        <>
          <ApplicationDetailsDialog
            application={selectedApplication}
            isOpen={detailsDialogOpen}
            onClose={closeDetailsDialog}
          />
          
          <SmsConversationDialog
            application={selectedApplication}
            open={smsDialogOpen}
            onOpenChange={(open) => !open && closeSmsDialog()}
          />
          
          <TenstreetUpdateModal
            application={selectedApplication}
            isOpen={tenstreetModalOpen}
            onClose={closeTenstreetModal}
          />
        </>
      )}

      {screeningApplication && (
        <ScreeningRequestsDialog
          application={screeningApplication}
          open={screeningDialogOpen}
          onOpenChange={(open) => !open && closeScreeningDialog()}
        />
      )}
    </PageLayout>
  );
}
