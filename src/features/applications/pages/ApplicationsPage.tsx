import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download } from 'lucide-react';

import { PageLayout } from '@/features/shared';
import { useApplications } from '../hooks/useApplications';
import { filterApplications, getStatusCounts, getCategoryCounts } from '@/utils/applicationHelpers';
import { generateApplicationsPDF } from '@/utils/pdfGenerator';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';

import {
  ApplicationDetailsDialog,
  TenstreetUpdateDialog,
  TenstreetUpdateModal,
  SmsConversationDialog,
  ApplicationsOverview,
  ApplicationsSearch,
  ApplicationCard
} from '../components';

const ApplicationsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [tenstreetModalOpen, setTenstreetModalOpen] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const {
    applications,
    loading,
    error,
    createApplication,
    updateApplication,
    deleteApplication,
  } = useApplications();

  const handleSmsOpen = (application: any) => {
    setSelectedApplication(application);
    setSmsDialogOpen(true);
  };

  const handleDetailsView = (application: any) => {
    setSelectedApplication(application);
    setDetailsDialogOpen(true);
  };

  const downloadApplicationsPDF = async () => {
    try {
      const filteredApps = filterApplications(applications || [], searchTerm, categoryFilter, sourceFilter);
      await generateApplicationsPDF(filteredApps);
      toast({
        title: "PDF Downloaded",
        description: "Applications report has been downloaded successfully",
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF report",
        variant: "destructive",
      });
    }
  };

  const filteredApplications = filterApplications(applications || [], searchTerm, categoryFilter, sourceFilter);
  const statusCounts = getStatusCounts(applications || []);
  const categoryCounts = getCategoryCounts(applications || []);

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
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
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
      description="Track and manage job applications"
      actions={pageActions}
    >
      <div className={`${isMobile ? 'p-4' : 'p-6'} max-w-7xl mx-auto`}>
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-6">Applications Overview</h3>
              <ApplicationsOverview 
                statusCounts={statusCounts} 
                categoryCounts={categoryCounts} 
              />
            </CardContent>
          </Card>
          
          <ApplicationsSearch
            searchTerm={searchTerm}
            categoryFilter={categoryFilter}
            sourceFilter={sourceFilter}
            onSearchChange={setSearchTerm}
            onCategoryChange={setCategoryFilter}
            onSourceChange={setSourceFilter}
          />

          <div className="space-y-4">
            {filteredApplications.length > 0 ? (
              filteredApplications.map((application, index) => (
                <ApplicationCard
                  key={application.id || index}
                  application={application}
                  onStatusChange={(applicationId, newStatus) => updateApplication(applicationId, { status: newStatus as 'pending' | 'reviewed' | 'interviewing' | 'hired' | 'rejected' })}
                  onRecruiterAssignment={(applicationId, recruiterId) => {
                    // Note: recruiter_id field is not part of the current UpdateApplicationData schema
                    console.log('Recruiter assignment requested for:', applicationId, recruiterId);
                  }}
                  onDetailsView={() => handleDetailsView(application)}
                  onSmsOpen={() => handleSmsOpen(application)}
                  onTenstreetUpdate={() => {
                    setSelectedApplication(application);
                    setTenstreetModalOpen(true);
                  }}
                />
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">
                    {loading ? "Loading applications..." : "No applications found"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Enhanced Dialogs */}
        {selectedApplication && (
          <>
            <SmsConversationDialog
              application={selectedApplication}
              open={smsDialogOpen}
              onOpenChange={setSmsDialogOpen}
            />
            
            <ApplicationDetailsDialog
              application={selectedApplication}
              isOpen={detailsDialogOpen}
              onClose={() => setDetailsDialogOpen(false)}
            />
            
            <TenstreetUpdateModal
              application={selectedApplication}
              isOpen={tenstreetModalOpen}
              onClose={() => setTenstreetModalOpen(false)}
            />
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default ApplicationsPage;