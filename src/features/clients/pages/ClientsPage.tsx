import React, { useState, useMemo } from 'react';
import { PageLayout } from '@/features/shared';
import {
  ClientsHeader,
  ClientsSearch,
  ClientsTable,
  ClientsSummary,
  ClientsLoading,
  CreateClientDialog,
  EditClientDialog,
  BulkTenstreetAssignmentDialog
} from '../components';
import { useClientsService } from '../hooks';
import { useAuth } from '@/hooks/useAuth';
import type { Client, ClientFilters } from '../types/client.types';

const ClientsPage = () => {
  const [filters, setFilters] = useState<ClientFilters>({});
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBulkTenstreetDialog, setShowBulkTenstreetDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  const { userRole, organization } = useAuth();
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';

  const {
    clients,
    loading,
    error,
    createClient,
    updateClient,
    deleteClient,
    getClientsBySearch,
    isCreating,
    isUpdating,
    isDeleting,
    refresh
  } = useClientsService({
    enabled: !!organization || userRole === 'super_admin'
  });

  // Filter clients based on current filters
  const filteredClients = useMemo(() => {
    if (!clients) return [];
    
    let filtered = clients;

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchLower) ||
        client.company?.toLowerCase().includes(searchLower) ||
        client.email?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(client => client.status === filters.status);
    }

    // Apply location filter
    if (filters.location) {
      const locationLower = filters.location.toLowerCase();
      filtered = filtered.filter(client =>
        client.city?.toLowerCase().includes(locationLower) ||
        client.state?.toLowerCase().includes(locationLower)
      );
    }

    return filtered;
  }, [clients, filters]);

  const handleCreateClient = () => {
    setShowCreateDialog(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
  };

  const handleDeleteClient = (clientId: string) => {
    if (confirm('Are you sure you want to delete this client?')) {
      deleteClient(clientId);
    }
  };

  const handleCreateSubmit = (data: any) => {
    createClient(data);
    setShowCreateDialog(false);
  };

  const handleEditSubmit = (id: string, data: any) => {
    updateClient(id, data);
    setEditingClient(null);
  };

  if (loading) {
    return <ClientsLoading />;
  }

  if (error) {
    return (
      <PageLayout title="Clients" description="Manage your client relationships and contact information">
        <div className="p-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Error Loading Clients</h1>
            <p className="text-muted-foreground mb-4">
              There was an error loading your client data: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
            {userRole === 'super_admin' && (
              <p className="text-sm text-muted-foreground mt-2">
                Super Admin: You should have access to all clients
              </p>
            )}
            {!organization && userRole !== 'super_admin' && (
              <p className="text-sm text-muted-foreground mt-2">
                No organization found. Please contact your administrator.
              </p>
            )}
            <button 
              onClick={() => refresh()}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Try Again
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="Clients" 
      description="Manage your client relationships and contact information"
    >
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <ClientsHeader 
          clientsCount={filteredClients.length} 
          onCreateClient={handleCreateClient}
          onBulkTenstreet={() => setShowBulkTenstreetDialog(true)}
          showBulkTenstreet={!!organization?.id}
        />
        <div className="mt-6 space-y-6">
          <ClientsSearch 
            clientsCount={filteredClients.length}
            onFiltersChange={setFilters}
            filters={filters}
          />
          <ClientsTable 
            clients={filteredClients}
            organizationId={organization?.id}
            onEditClient={handleEditClient}
            onDeleteClient={handleDeleteClient}
          />
          <ClientsSummary clients={filteredClients} />
        </div>
      </div>

      {/* Dialogs */}
      <CreateClientDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreateSubmit}
        isLoading={isCreating}
      />

      <EditClientDialog
        open={!!editingClient}
        onOpenChange={(open) => !open && setEditingClient(null)}
        onSubmit={handleEditSubmit}
        client={editingClient}
        isLoading={isUpdating}
      />

      {organization?.id && (
        <BulkTenstreetAssignmentDialog
          open={showBulkTenstreetDialog}
          onOpenChange={setShowBulkTenstreetDialog}
          organizationId={organization.id}
          clients={clients || []}
        />
      )}
    </PageLayout>
  );
};

export default ClientsPage;