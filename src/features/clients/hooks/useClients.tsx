import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

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
  organization_id: string | null;
}

interface CreateClientData {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  notes?: string;
  status?: string;
}

interface UpdateClientData extends CreateClientData {
  id: string;
}

export const useClients = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userRole, organization } = useAuth();
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';

  const {
    data: clients,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['clients', organization?.id],
    queryFn: async (): Promise<Client[]> => {
      console.log('Fetching clients for organization:', organization?.id);
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching clients:', error);
        throw error;
      }

      console.log('Clients fetched:', data?.length || 0);
      return data || [];
    },
    enabled: !!organization || userRole === 'super_admin',
  });

  const createClientMutation = useMutation({
    mutationFn: async (clientData: CreateClientData) => {
      const { data, error } = await supabase
        .from('clients')
        .insert([{
          ...clientData,
          organization_id: organization?.id || null
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: 'Client Created',
        description: 'The client has been successfully created.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create client',
        variant: 'destructive',
      });
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async (clientData: UpdateClientData) => {
      const { id, ...updates } = clientData;
      
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: 'Client Updated',
        description: 'The client has been successfully updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update client',
        variant: 'destructive',
      });
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: 'Client Deleted',
        description: 'The client has been successfully deleted.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete client',
        variant: 'destructive',
      });
    },
  });

  return {
    clients: clients || [],
    isLoading,
    error,
    refetch,
    createClient: createClientMutation.mutate,
    updateClient: updateClientMutation.mutate,
    deleteClient: deleteClientMutation.mutate,
    isCreating: createClientMutation.isPending,
    isUpdating: updateClientMutation.isPending,
    isDeleting: deleteClientMutation.isPending,
    isAdmin,
    organization,
    userRole,
  };
};