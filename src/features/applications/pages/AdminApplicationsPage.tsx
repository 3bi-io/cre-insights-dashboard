import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePlatformAccess } from '@/hooks/usePlatformAccess';
import PageLayout from '@/features/shared/components/PageLayout';
import { useApplicationsManagement } from '../hooks/useApplicationsManagement';
import { useOrganizationData } from '../hooks/useOrganizationData';
import { useApplicationDialogs } from '../hooks/useApplicationDialogs';
import { Card } from '@/components/ui/card';
import { ApplicationsStats } from '../components/ApplicationsStats';
import { ApplicationsFilters } from '../components/ApplicationsFilters';
import { ApplicationsActions } from '../components/ApplicationsActions';
import { ApplicationsGrid } from '../components/ApplicationsGrid';
import ApplicationDetailsDialog from '@/components/applications/ApplicationDetailsDialog';
import SmsConversationDialog from '@/components/applications/SmsConversationDialog';
import TenstreetUpdateModal from '@/components/applications/TenstreetUpdateModal';
import ScreeningRequestsDialog from '@/components/applications/ScreeningRequestsDialog';
import { Skeleton } from '@/components/ui/skeleton';
import type { Application } from '@/types/common.types';

export default function AdminApplicationsPage() {
  const { user, userRole } = useAuth();
  const { checkPlatformAccess } = usePlatformAccess();
  const [hasAccess, setHasAccess] = useState(false);
  
  // Role detection
  const isSuperAdmin = userRole === 'super_admin';
  const isOrgAdmin = userRole === 'admin';

  // Check platform access
  useEffect(() => {
    const checkAccess = async () => {
      const access = await checkPlatformAccess('applications');
      setHasAccess(access);
    };
    checkAccess();
  }, [checkPlatformAccess]);

  // Organization data for super admins
  const { organizations } = useOrganizationData(isSuperAdmin);

  // Applications management
  const {
    applications,
    loading,
    statusCounts,
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
    selectedApplications,
    handleSelectAll,
    handleSelectApplication,
    clearSelection,
    updateApplication,
    handleBulkStatusChange,
    handleExportPDF,
    handleExportCSV,
  } = useApplicationsManagement(hasAccess, isOrgAdmin);

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
        <ApplicationsActions
          selectedCount={selectedApplications.size}
          onExportPDF={handleExportPDF}
          onExportCSV={handleExportCSV}
          onBulkStatusChange={handleBulkStatusChange}
          onClearSelection={clearSelection}
        />
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
        />

        {/* Applications Grid */}
        <ApplicationsGrid
          applications={applications}
          statusCounts={statusCounts}
          selectedApplications={selectedApplications}
          onSelectAll={handleSelectAll}
          onSelectApplication={handleSelectApplication}
          onStatusChange={(id, status) => 
            updateApplication(id, { status: status as 'pending' | 'reviewed' | 'interviewing' | 'hired' | 'rejected' })
          }
          onSmsOpen={handleSmsOpen}
          onDetailsView={handleDetailsView}
          onTenstreetUpdate={handleTenstreetUpdate}
          onScreeningOpen={handleScreeningOpen}
        />
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
