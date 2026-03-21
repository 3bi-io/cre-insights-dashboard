import React, { useState, useMemo } from 'react';
import { PageLayout } from '@/features/shared';
import { Plus, Truck, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
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
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog';

const ITEMS_PER_PAGE = 25;

const ClientsPage = () => {
  const [filters, setFilters] = useState<ClientFilters>({});
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBulkTenstreetDialog, setShowBulkTenstreetDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const { userRole, organization } = useAuth();

  const {
    clients,
    loading,
    error,
    createClient,
    updateClient,
    deleteClient,
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

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchLower) ||
        client.company?.toLowerCase().includes(searchLower) ||
        client.email?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(client => client.status === filters.status);
    }

    if (filters.location) {
      const locationLower = filters.location.toLowerCase();
      filtered = filtered.filter(client =>
        client.city?.toLowerCase().includes(locationLower) ||
        client.state?.toLowerCase().includes(locationLower)
      );
    }

    return filtered;
  }, [clients, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredClients.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredClients, currentPage]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handleExportCSV = () => {
    const headers = ['Name', 'Company', 'Email', 'Phone', 'City', 'State', 'Status'];
    const rows = filteredClients.map(c => [
      c.name, c.company || '', c.email || '', c.phone || '',
      c.city || '', c.state || '', c.status
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clients-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateClient = () => setShowCreateDialog(true);
  const handleEditClient = (client: Client) => setEditingClient(client);

  const handleDeleteClick = (clientId: string) => {
    setClientToDelete(clientId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (clientToDelete) deleteClient(clientToDelete);
    setDeleteDialogOpen(false);
    setClientToDelete(null);
  };

  const handleCreateSubmit = (data: any) => {
    createClient(data);
    setShowCreateDialog(false);
  };

  const handleEditSubmit = (id: string, data: any) => {
    updateClient(id, data);
    setEditingClient(null);
  };

  if (loading) return <ClientsLoading />;

  if (error) {
    return (
      <PageLayout title="Clients" description="Manage your client relationships and contact information">
        <div className="p-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Error Loading Clients</h1>
            <p className="text-muted-foreground mb-4">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
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

  const headerActions = (
    <div className="flex items-center gap-2 flex-wrap">
      <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Export</span>
      </Button>
      {!!organization?.id && (
        <Button variant="outline" size="sm" onClick={() => setShowBulkTenstreetDialog(true)} className="gap-2">
          <Truck className="w-4 h-4" />
          <span className="hidden sm:inline">Bulk Tenstreet</span>
        </Button>
      )}
      <Button size="sm" onClick={handleCreateClient} className="gap-2">
        <Plus className="w-4 h-4" />
        Add Client
      </Button>
    </div>
  );

  return (
    <PageLayout 
      title="Clients" 
      description="Manage your client relationships and contact information"
      actions={headerActions}
    >
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        <ClientsSearch 
          clientsCount={filteredClients.length}
          onFiltersChange={setFilters}
          filters={filters}
        />
        
        <ClientsSummary clients={filteredClients} />
        
        <ClientsTable 
          clients={paginatedClients}
          organizationId={organization?.id}
          onEditClient={handleEditClient}
          onDeleteClient={handleDeleteClick}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredClients.length}
          onPageChange={setCurrentPage}
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
      </div>

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
