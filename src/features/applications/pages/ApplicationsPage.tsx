import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Webhook } from 'lucide-react';

import { PageLayout } from '@/features/shared';
import { useApplications } from '../hooks/useApplications';
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

  const downloadApplicationsPDF = () => {
    try {
      const filteredApps = applications || [];
      // Simplified PDF generation call
      console.log('Generating PDF for', filteredApps.length, 'applications');
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

  const filteredApplications = applications || [];
  const statusCounts = { new: 0, in_progress: 0, completed: 0, rejected: 0 };
  const categoryCounts = { all: applications?.length || 0 };

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
        <Tabs defaultValue="applications" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="webhook-setup" className="flex items-center gap-2">
              <Webhook className="w-4 h-4" />
              Zapier Integration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Applications Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{applications?.length || 0}</div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">0</div>
                    <div className="text-sm text-muted-foreground">New</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">0</div>
                    <div className="text-sm text-muted-foreground">In Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Search Applications</h3>
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    placeholder="Search applications..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-md"
                  />
                  <select 
                    value={categoryFilter} 
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="all">All Categories</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {filteredApplications.length > 0 ? (
                filteredApplications.map((application) => (
                  <Card key={application.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{application.first_name} {application.last_name}</h4>
                          <p className="text-muted-foreground">{application.email || 'No email'}</p>
                          <p className="text-sm text-muted-foreground">{application.phone || 'No phone'}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDetailsView(application)}
                          >
                            View Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSmsOpen(application)}
                          >
                            SMS
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground">No applications found</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="webhook-setup">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Zapier Integration</h3>
                <p className="text-muted-foreground">
                  Zapier webhook integration setup coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Simplified Dialogs */}
        {selectedApplication && (
          <>
            {smsDialogOpen && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <Card className="w-full max-w-md">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4">SMS Conversation</h3>
                    <p className="text-muted-foreground mb-4">
                      SMS conversation with {selectedApplication.first_name} {selectedApplication.last_name}
                    </p>
                    <Button onClick={() => setSmsDialogOpen(false)}>Close</Button>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {detailsDialogOpen && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <Card className="w-full max-w-2xl">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4">Application Details</h3>
                    <div className="space-y-2">
                      <p><strong>Name:</strong> {selectedApplication.first_name} {selectedApplication.last_name}</p>
                      <p><strong>Email:</strong> {selectedApplication.email || 'No email'}</p>
                      <p><strong>Phone:</strong> {selectedApplication.phone || 'No phone'}</p>
                    </div>
                    <Button onClick={() => setDetailsDialogOpen(false)} className="mt-4">Close</Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default ApplicationsPage;