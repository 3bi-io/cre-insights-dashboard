import React from 'react';
import { PageLayout } from '@/features/shared';
import {
  ClientsHeader,
  ClientsSearch,
  ClientsTable,
  ClientsSummary,
  ClientsLoading
} from '../components';
import { useClients } from '../hooks';

const ClientsPage = () => {
  const {
    clients,
    isLoading,
    error,
    isAdmin,
    organization,
    userRole
  } = useClients();

  // Debug logging
  console.log('Clients Page Debug:', {
    clientsCount: clients?.length || 0,
    loading: isLoading,
    error,
    userRole,
    isAdmin,
    organization: organization?.name || 'No organization',
    organizationId: organization?.id || 'No ID'
  });

  if (isLoading) {
    return (
      <PageLayout title="Clients" description="Manage your client relationships and contact information">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded-lg"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </PageLayout>
    );
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
        <ClientsHeader clientsCount={clients?.length || 0} />
        <div className="mt-6 space-y-6">
          <ClientsSearch clientsCount={clients?.length || 0} />
          <ClientsTable clients={clients || []} />
          <ClientsSummary clients={clients || []} />
        </div>
      </div>
    </PageLayout>
  );
};

export default ClientsPage;