import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageLayout } from '@/features/shared';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2 } from 'lucide-react';
import { useClientsService } from '../hooks';
import { useClientMetrics } from '../hooks/useClientMetrics';
import { useClientApplications } from '../hooks/useClientApplications';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import type { Client } from '../types/client.types';
import type { ClientApplication } from '../hooks/useClientApplications';

import ClientSidebar from '../components/ats/ClientSidebar';
import ClientOverviewTab from '../components/ats/ClientOverviewTab';
import ClientApplicantsTab from '../components/ats/ClientApplicantsTab';
import ClientAnalyticsTab from '../components/ats/ClientAnalyticsTab';
import ClientSettingsTab from '../components/ats/ClientSettingsTab';
import ApplicantQuickView from '../components/ats/ApplicantQuickView';
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog';
import CreateClientDialog from '../components/CreateClientDialog';
import EditClientDialog from '../components/EditClientDialog';

const ClientsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedClientId = searchParams.get('clientId');
  const activeTab = searchParams.get('tab') || 'overview';

  const [sidebarSearch, setSidebarSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<ClientApplication | null>(null);

  const { userRole, organization } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    clients, loading, error,
    createClient, updateClient, deleteClient,
    isCreating, isUpdating, isDeleting, refresh,
  } = useClientsService({ enabled: !!organization || userRole === 'super_admin' });

  const { clients: clientMetrics } = useClientMetrics();
  const { data: applications = [], isLoading: appsLoading } = useClientApplications(selectedClientId);

  const selectedClient = useMemo(
    () => clients?.find(c => c.id === selectedClientId) || null,
    [clients, selectedClientId]
  );

  // Auto-select first client if none selected
  useEffect(() => {
    if (!selectedClientId && clients && clients.length > 0 && !loading) {
      setSearchParams(prev => {
        prev.set('clientId', clients[0].id);
        return prev;
      }, { replace: true });
    }
  }, [clients, selectedClientId, loading, setSearchParams]);

  const handleSelectClient = useCallback((id: string) => {
    setSearchParams(prev => {
      prev.set('clientId', id);
      return prev;
    });
  }, [setSearchParams]);

  const handleTabChange = useCallback((tab: string) => {
    setSearchParams(prev => {
      prev.set('tab', tab);
      return prev;
    });
  }, [setSearchParams]);

  const handleStageChange = useCallback(async (applicationId: string, newStage: string) => {
    const { error } = await supabase
      .from('applications')
      .update({ status: newStage, updated_at: new Date().toISOString() })
      .eq('id', applicationId);

    if (error) {
      toast({ title: 'Error updating stage', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Stage updated' });
      queryClient.invalidateQueries({ queryKey: ['client-applications'] });
    }
  }, [toast, queryClient]);

  const handleCreateSubmit = (data: any) => {
    createClient(data);
    setShowCreateDialog(false);
  };

  const handleEditSubmit = (id: string, data: any) => {
    updateClient(id, data);
    setEditingClient(null);
  };

  const handleDeleteClick = (clientId: string) => {
    setClientToDelete(clientId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (clientToDelete) deleteClient(clientToDelete);
    setDeleteDialogOpen(false);
    setClientToDelete(null);
  };

  if (loading) {
    return (
      <PageLayout title="Clients" description="Applicant Tracking System">
        <div className="flex h-[calc(100vh-120px)]">
          <div className="w-72 border-r p-3 space-y-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
          <div className="flex-1 p-6 space-y-4">
            <Skeleton className="h-10 w-48" />
            <div className="grid grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24" />)}
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Clients" description="Applicant Tracking System">
        <div className="p-6 text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Error Loading Clients</h1>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
          <button onClick={() => refresh()} className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
            Try Again
          </button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Clients" description="Applicant Tracking System">
      <div className="flex h-[calc(100vh-120px)]">
        {/* Left Panel - Client Sidebar */}
        <ClientSidebar
          clients={clients || []}
          clientMetrics={clientMetrics}
          selectedClientId={selectedClientId}
          onSelectClient={handleSelectClient}
          onAddClient={() => setShowCreateDialog(true)}
          searchQuery={sidebarSearch}
          onSearchChange={setSidebarSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />

        {/* Right Panel - Client Detail */}
        <div className="flex-1 overflow-y-auto">
          {selectedClient ? (
            <div className="p-4 sm:p-6">
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="mb-6">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="applicants">Applicants</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <ClientOverviewTab
                    client={selectedClient}
                    applications={applications}
                    onEditClient={() => setEditingClient(selectedClient)}
                  />
                </TabsContent>

                <TabsContent value="applicants">
                  {appsLoading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                  ) : (
                    <ClientApplicantsTab
                      applications={applications}
                      onApplicationClick={setSelectedApplication}
                      onStageChange={handleStageChange}
                    />
                  )}
                </TabsContent>

                <TabsContent value="analytics">
                  <ClientAnalyticsTab applications={applications} />
                </TabsContent>

                <TabsContent value="settings">
                  <ClientSettingsTab client={selectedClient} />
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-1">Select a Client</h3>
                <p className="text-sm text-muted-foreground">Choose a client from the sidebar to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick View Drawer */}
      <ApplicantQuickView
        application={selectedApplication}
        open={!!selectedApplication}
        onOpenChange={open => !open && setSelectedApplication(null)}
        onStageChange={handleStageChange}
      />

      {/* Dialogs */}
      <CreateClientDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreateSubmit}
        isLoading={isCreating}
      />
      <EditClientDialog
        open={!!editingClient}
        onOpenChange={open => !open && setEditingClient(null)}
        onSubmit={handleEditSubmit}
        client={editingClient}
        isLoading={isUpdating}
      />
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Client"
        description="Are you sure you want to delete this client?"
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </PageLayout>
  );
};

export default ClientsPage;
