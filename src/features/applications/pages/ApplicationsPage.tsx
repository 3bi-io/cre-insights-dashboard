import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Webhook } from 'lucide-react';

import { PageLayout } from '@/features/shared';
import { useApplications } from '@/hooks/useApplications';
import { filterApplications, getStatusCounts, getCategoryCounts } from '@/utils/applicationHelpers';
import { generateApplicationsPDF } from '@/utils/pdfGenerator';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';

import {
  ZapierWebhookSetup,
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
    recruiters,
    currentRecruiter,
    isLoading,
    assignRecruiter,
    updateStatus,
  } = useApplications();

  const handleSmsOpen = (application: any) => {
    setSelectedApplication(application);
    setSmsDialogOpen(true);
  };

  const handleDetailsView = (application: any) => {
    setSelectedApplication(application);
    setDetailsDialogOpen(true);
  };

  const downloadApplicationsPDF = () => {
    try {
      const filteredApps = filterApplications(applications || [], {
        searchTerm,
        categoryFilter,
        sourceFilter
      });
      
      generateApplicationsPDF(filteredApps);
      toast({
        title: "PDF Downloaded",
        description: "Applications report has been downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF report",
        variant: "destructive",
      });
    }
  };

  const filteredApplications = filterApplications(applications || [], {
    searchTerm,
    categoryFilter,
    sourceFilter
  });

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

  if (isLoading) {
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
        <Tabs defaultValue="applications" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="webhook-setup" className="flex items-center gap-2">
              <Webhook className="w-4 h-4" />
              Zapier Integration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="space-y-6">
            <ApplicationsOverview statusCounts={statusCounts} />
            
            <ApplicationsSearch
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              sourceFilter={sourceFilter}
              setSourceFilter={setSourceFilter}
              categoryCounts={categoryCounts}
            />

            <div className="space-y-4">
              {filteredApplications.map((application) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  onSmsOpen={handleSmsOpen}
                  onDetailsView={handleDetailsView}
                  onStatusUpdate={updateStatus}
                  onAssignRecruiter={assignRecruiter}
                  recruiters={recruiters || []}
                  currentRecruiter={currentRecruiter}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="webhook-setup">
            <ZapierWebhookSetup />
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <SmsConversationDialog
          application={selectedApplication}
          open={smsDialogOpen}
          onOpenChange={setSmsDialogOpen}
        />

        <ApplicationDetailsDialog
          application={selectedApplication}
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
        />

        <TenstreetUpdateModal
          application={selectedApplication}
          open={tenstreetModalOpen}
          onOpenChange={setTenstreetModalOpen}
        />
      </div>
    </PageLayout>
  );
};

export default ApplicationsPage;