import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';

import { PageLayout } from '@/features/shared';
import { useApplications } from '../hooks/useApplications';
import { useApplicationDialogs } from '../hooks/useApplicationDialogs';
import { useOrganizationData } from '../hooks/useOrganizationData';
import { useWebhookOptions } from '@/hooks/useWebhookOptions';
import { getStatusCounts, getCategoryCounts, getApplicantCategory, getApplicantName, getApplicantEmail } from '@/utils/applicationHelpers';
import { generateApplicationsPDF } from '@/utils/pdfGenerator';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import { ExportToN8nButton } from '@/components/applications/ExportToN8nButton';

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
  ApplicationsHeader
} from '../components';
import { TableColumnVisibility, ColumnVisibility } from '../components/TableColumnVisibility';
import ScreeningRequestsDialog from '@/components/applications/ScreeningRequestsDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

const ApplicationsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [organizationFilter, setOrganizationFilter] = useState('all');
  const [webhookFilter, setWebhookFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set());
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
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { userRole } = useAuth();

  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const isSuperAdmin = userRole === 'super_admin';
  const isOrgAdmin = userRole === 'admin' && !isSuperAdmin;

  // Use refactored hooks
  const { organizations } = useOrganizationData(isSuperAdmin);
  const { data: webhookOptions = [] } = useWebhookOptions(
    organizationFilter !== 'all' ? organizationFilter : undefined
  );
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
      search: searchTerm,
      // Org admins see only their organization's applications
      organization_id: isOrgAdmin && organizationFilter === 'all' 
        ? undefined // Let RLS handle it for org admins
        : organizationFilter !== 'all' 
          ? organizationFilter 
          : undefined,
      webhook_id: webhookFilter !== 'all' ? webhookFilter : undefined,
    }
  });

  // Client-side filtering for category and source (not database fields)
  const applications = React.useMemo(() => {
    if (!serverFilteredApplications) return [];
    
    return serverFilteredApplications.filter(app => {
      // Category filter
      if (categoryFilter !== 'all') {
        const category = getApplicantCategory(app);
        if (category.code !== categoryFilter) return false;
      }
      
      // Source filter
      if (sourceFilter !== 'all') {
        const source = app.source || 'Other';
        if (source !== sourceFilter) return false;
      }
      
      return true;
    });
  }, [serverFilteredApplications, categoryFilter, sourceFilter]);

  const downloadApplicationsPDF = async () => {
    try {
      await generateApplicationsPDF(applications || []);
      toast({
        title: "PDF Downloaded",
        description: "Applications report has been downloaded successfully",
      });
    } catch (error) {
      logger.error('PDF generation error', error, 'Applications');
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF report",
        variant: "destructive",
      });
    }
  };

  const downloadApplicationsCSV = () => {
    try {
      const exportData = applications.map(app => ({
        'Applicant Name': getApplicantName(app),
        'Email': getApplicantEmail(app),
        'Phone': app.phone || '',
        'Job': app.job_listings?.title || app.job_listings?.job_title || '',
        'Status': app.status,
        'Location': `${app.city || ''} ${app.state || ''}`.trim(),
        'Date Applied': new Date(app.applied_at).toLocaleDateString(),
        'Recruiter': app.recruiters ? `${app.recruiters.first_name} ${app.recruiters.last_name}` : 'Unassigned',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Applications');
      XLSX.writeFile(wb, `applications-${new Date().toISOString().split('T')[0]}.xlsx`);

      toast({
        title: "CSV Downloaded",
        description: "Applications data has been exported successfully",
      });
    } catch (error) {
      logger.error('CSV export error', error, 'Applications');
      toast({
        title: "Export Failed",
        description: "Failed to export CSV data",
        variant: "destructive",
      });
    }
  };

  const handleSelectApplication = useCallback((applicationId: string, checked: boolean) => {
    setSelectedApplications(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(applicationId);
      } else {
        newSet.delete(applicationId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedApplications(new Set(applications.map(app => app.id)));
    } else {
      setSelectedApplications(new Set());
    }
  }, [applications]);

  const handleBulkStatusChange = useCallback(async (status: 'pending' | 'reviewed' | 'interviewing' | 'hired' | 'rejected') => {
    const selectedIds = Array.from(selectedApplications);
    try {
      await Promise.all(
        selectedIds.map(id => updateApplication(id, { status }))
      );
      toast({
        title: "Status Updated",
        description: `${selectedIds.length} application(s) updated to ${status}`,
      });
      setSelectedApplications(new Set());
    } catch (error) {
      logger.error('Bulk status change error', error, 'Applications');
      toast({
        title: "Update Failed",
        description: "Failed to update application statuses",
        variant: "destructive",
      });
    }
  }, [selectedApplications, updateApplication, toast]);

  const handleBulkDelete = useCallback(() => {
    // Delete not supported for compliance - applications maintain audit trail
    deleteApplication();
    setSelectedApplications(new Set());
  }, [deleteApplication]);

  const handleBulkExportSelected = useCallback(() => {
    try {
      const selectedApps = applications.filter(app => selectedApplications.has(app.id));
      const exportData = selectedApps.map(app => ({
        'Applicant Name': getApplicantName(app),
        'Email': getApplicantEmail(app),
        'Phone': app.phone || '',
        'Job': app.job_listings?.title || app.job_listings?.job_title || '',
        'Status': app.status,
        'Location': `${app.city || ''} ${app.state || ''}`.trim(),
        'Date Applied': new Date(app.applied_at).toLocaleDateString(),
        'Recruiter': app.recruiters ? `${app.recruiters.first_name} ${app.recruiters.last_name}` : 'Unassigned',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Selected Applications');
      XLSX.writeFile(wb, `selected-applications-${new Date().toISOString().split('T')[0]}.xlsx`);

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
  }, [applications, selectedApplications, toast]);

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
    filters: { searchTerm, categoryFilter, sourceFilter, organizationFilter }
  }, 'Applications');

  const pageActions = (
    <div className="flex items-center gap-2 flex-wrap">
      {viewMode === 'table' && (
        <TableColumnVisibility
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={handleColumnVisibilityChange}
        />
      )}
      
      <ExportToN8nButton
        filters={{
          search: searchTerm,
          status: categoryFilter,
          source: sourceFilter,
          organization_id: organizationFilter,
        }}
        disabled={!applications || applications.length === 0}
      />
      
      <ApplicationsActions
        selectedCount={selectedApplications.size}
        onExportPDF={downloadApplicationsPDF}
        onExportCSV={downloadApplicationsCSV}
        onBulkStatusChange={handleBulkStatusChange}
        onBulkDelete={handleBulkDelete}
        onBulkExportSelected={handleBulkExportSelected}
        onClearSelection={() => setSelectedApplications(new Set())}
      />
    </div>
  );

  if (loading) {
    return (
      <PageLayout title="Applications" description="Track and manage job applications">
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-8 bg-muted rounded mb-2"></div>
                    <div className="h-4 bg-muted/50 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-muted rounded-full"></div>
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-muted rounded w-1/3"></div>
                        <div className="h-3 bg-muted/70 rounded w-1/2"></div>
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
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="space-y-6">
          <ApplicationsHeader 
            totalCount={applications?.length || 0}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
          
          <ApplicationsOverview 
            statusCounts={statusCounts} 
            categoryCounts={categoryCounts} 
          />
          
          <ApplicationsSearch
            searchTerm={searchTerm}
            categoryFilter={categoryFilter}
            sourceFilter={sourceFilter}
            organizationFilter={organizationFilter}
            webhookFilter={webhookFilter}
            onSearchChange={setSearchTerm}
            onCategoryChange={setCategoryFilter}
            onSourceChange={setSourceFilter}
            onOrganizationChange={setOrganizationFilter}
            onWebhookChange={setWebhookFilter}
            showOrganizationFilter={isSuperAdmin}
            showWebhookFilter={isAdmin}
            organizations={organizations}
            webhookOptions={webhookOptions}
          />

          {/* Pagination Indicator */}
          {totalCount > 0 && (
            <Alert className="bg-muted/50 border-border">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Showing <strong>{applications.length}</strong> of <strong>{totalCount}</strong> applications
                {hasMore && (
                  <Button
                    variant="link"
                    className="ml-2 p-0 h-auto"
                    onClick={loadMore}
                  >
                    Load more
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {applications && applications.length > 0 ? (
              viewMode === 'card' ? (
                applications.map((application) => (
                  <ApplicationCard
                    key={application.id}
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
                  onSelectAll={handleSelectAll}
                />
              )
            ) : (
              <Card>
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
            <div className="flex justify-center py-6">
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