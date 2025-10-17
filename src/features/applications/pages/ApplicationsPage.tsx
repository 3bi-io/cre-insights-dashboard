import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download } from 'lucide-react';

import { PageLayout } from '@/features/shared';
import { useApplications } from '../hooks/useApplications';
import { useApplicationDialogs } from '../hooks/useApplicationDialogs';
import { useOrganizationData } from '../hooks/useOrganizationData';
import { getStatusCounts, getCategoryCounts, getApplicantCategory } from '@/utils/applicationHelpers';
import { generateApplicationsPDF } from '@/utils/pdfGenerator';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/services/loggerService';

import {
  ApplicationDetailsDialog,
  TenstreetUpdateDialog,
  TenstreetUpdateModal,
  SmsConversationDialog,
  ApplicationsOverview,
  ApplicationsSearch,
  ApplicationCard
} from '../components';
import ScreeningRequestsDialog from '@/components/applications/ScreeningRequestsDialog';

const ApplicationsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [organizationFilter, setOrganizationFilter] = useState('all');
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { userRole } = useAuth();

  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const isSuperAdmin = userRole === 'super_admin';
  const isOrgAdmin = userRole === 'admin' && !isSuperAdmin;

  // Use refactored hooks
  const { organizations } = useOrganizationData(isSuperAdmin);
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
    <Button
      onClick={downloadApplicationsPDF}
      className={`flex items-center gap-2 ${isMobile ? 'w-full justify-center' : ''}`}
      variant="outline"
      size={isMobile ? 'lg' : 'default'}
    >
      <Download className="w-4 h-4" />
      Export PDF
    </Button>
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
              searchTerm={searchTerm}
              categoryFilter={categoryFilter}
              sourceFilter={sourceFilter}
              organizationFilter={organizationFilter}
              onSearchChange={setSearchTerm}
              onCategoryChange={setCategoryFilter}
              onSourceChange={setSourceFilter}
              onOrganizationChange={setOrganizationFilter}
              showOrganizationFilter={isSuperAdmin}
              organizations={organizations}
            />
          </div>

          <div className="space-y-4">
            {applications && applications.length > 0 ? (
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