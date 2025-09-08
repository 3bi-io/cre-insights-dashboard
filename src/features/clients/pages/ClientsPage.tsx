import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

import { PageLayout } from '@/features/shared';
import {
  ClientsHeader,
  ClientsSearch,
  ClientsTable,
  ClientsSummary,
  ClientsLoading
} from '../components';

const ClientsPage = () => {
  const { toast } = useToast();

  const { data: clients, isLoading, error } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <PageLayout title="Clients" description="Manage your client relationships and contact information">
        <ClientsLoading />
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
              There was an error loading your client data
            </p>
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