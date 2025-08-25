
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Webhook } from 'lucide-react';
import ZapierWebhookSetup from '@/components/applications/ZapierWebhookSetup';
import ApplicationDetailsDialog from '@/components/applications/ApplicationDetailsDialog';
import TenstreetUpdateDialog from '@/components/applications/TenstreetUpdateDialog';
import TenstreetUpdateModal from '@/components/applications/TenstreetUpdateModal';
import SmsConversationDialog from '@/components/applications/SmsConversationDialog';
import ApplicationsOverview from '@/components/applications/ApplicationsOverview';
import ApplicationsSearch from '@/components/applications/ApplicationsSearch';
import ApplicationCard from '@/components/applications/ApplicationCard';

import MetaBackfillButton from '@/components/applications/MetaBackfillButton';
import RecentMetaLeadsButton from '@/components/applications/RecentMetaLeadsButton';
import { useApplications } from '@/hooks/useApplications';
import { filterApplications, getStatusCounts, getCategoryCounts } from '@/utils/applicationHelpers';
import { generateApplicationsPDF } from '@/utils/pdfGenerator';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';

const Applications = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
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

  const handleTenstreetUpdate = (application: any) => {
    setSelectedApplication(application);
    setTenstreetModalOpen(true);
  };

  const downloadApplicationsPDF = () => {
    try {
      generateApplicationsPDF(filteredApplications || []);
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

  const filteredApplications = filterApplications(applications || [], searchTerm, categoryFilter);
  const statusCounts = getStatusCounts(applications || []);
  const categoryCounts = getCategoryCounts(applications || []);

  if (isLoading) {
    return (
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
    );
  }

  return (
    <div className={`${isMobile ? 'p-4' : 'p-6'} max-w-7xl mx-auto`}>
      <div className={`flex ${isMobile ? 'flex-col gap-4' : 'flex-col sm:flex-row'} justify-between items-start sm:items-center gap-4 mb-8`}>
        <div>
          <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-foreground`}>Applications</h1>
          <p className="text-muted-foreground mt-1">Track and manage job applications</p>
        </div>
        <div className="flex gap-2">
          
          {/* Pull recent Meta leads */}
          <RecentMetaLeadsButton />
          {/* Backfill all historical Meta leads */}
          <MetaBackfillButton />
          <Button
            onClick={downloadApplicationsPDF}
            className={`flex items-center gap-2 ${isMobile ? 'w-full justify-center' : ''}`}
            variant="outline"
            size={isMobile ? 'lg' : 'default'}
          >
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <Tabs defaultValue="applications" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="webhook-setup" className="flex items-center gap-2">
            <Webhook className="w-4 h-4" />
            Zapier Integration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="space-y-6">
          <ApplicationsOverview 
            statusCounts={statusCounts}
            categoryCounts={categoryCounts}
          />

          <ApplicationsSearch
            searchTerm={searchTerm}
            categoryFilter={categoryFilter}
            onSearchChange={setSearchTerm}
            onCategoryChange={setCategoryFilter}
          />

          {/* Applications List */}
          <div className="space-y-4">
            {filteredApplications?.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                recruiters={recruiters}
                onStatusChange={(id, status) => updateStatus({ applicationId: id, newStatus: status })}
                onRecruiterAssignment={(id, recruiterId) => assignRecruiter({ applicationId: id, recruiterId })}
                onSmsOpen={handleSmsOpen}
                onDetailsView={handleDetailsView}
                onTenstreetUpdate={handleTenstreetUpdate}
              />
            ))}

            {filteredApplications?.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No applications found matching your criteria.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="webhook-setup">
          <ZapierWebhookSetup />
        </TabsContent>
      </Tabs>

      {/* Application Details Dialog */}
      {selectedApplication && (
        <ApplicationDetailsDialog
          application={selectedApplication}
          isOpen={detailsDialogOpen}
          onClose={() => {
            setDetailsDialogOpen(false);
            setSelectedApplication(null);
          }}
        />
      )}

      {/* SMS Conversation Dialog */}
      <SmsConversationDialog
        open={smsDialogOpen}
        onOpenChange={setSmsDialogOpen}
        application={selectedApplication}
        currentRecruiterId={currentRecruiter?.id}
      />

      {/* Tenstreet Update Modal */}
      {selectedApplication && (
        <TenstreetUpdateModal
          isOpen={tenstreetModalOpen}
          onClose={() => {
            setTenstreetModalOpen(false);
            setSelectedApplication(null);
          }}
          application={selectedApplication}
        />
      )}
    </div>
  );
};

export default Applications;
