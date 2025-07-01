
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ClientsHeader from '@/components/clients/ClientsHeader';
import ClientsSearch from '@/components/clients/ClientsSearch';
import ClientsTable from '@/components/clients/ClientsTable';
import ClientsSummary from '@/components/clients/ClientsSummary';
import ClientsLoading from '@/components/clients/ClientsLoading';

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

const Clients = () => {
  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async (): Promise<Client[]> => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching clients:', error);
        throw error;
      }

      return data || [];
    },
  });

  if (isLoading) {
    return <ClientsLoading />;
  }

  return (
    <div className="min-h-screen bg-background">
      <ClientsHeader clientsCount={clients?.length || 0} />

      <div className="container mx-auto px-8 py-8 max-w-7xl">
        <ClientsSearch clientsCount={clients?.length || 0} />
        <ClientsTable clients={clients || []} />
        <ClientsSummary clients={clients || []} />
      </div>
    </div>
  );
};

export default Clients;
