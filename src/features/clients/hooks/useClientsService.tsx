import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { clientsService } from '../services/ClientsService';
import type { Client, CreateClientData, UpdateClientData, ClientFilters } from '../types/client.types';
import { FilterOptions } from '@/features/shared/types/feature.types';

export interface ClientsFilters extends FilterOptions {
  search?: string;
  status?: string;
  location?: string;
}

export function useClientsService(options?: { 
  enabled?: boolean;
  filters?: ClientsFilters;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userRole, organization } = useAuth();

  const { data: clients, isLoading: loading, error, refetch: refresh } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const result = await clientsService.getClients();
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: options?.enabled !== false
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateClientData) => clientsService.createClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({ title: 'Client created successfully' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientData }) => 
      clientsService.updateClient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({ title: 'Client updated successfully' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => clientsService.deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({ title: 'Client deleted successfully' });
    }
  });

  const createClient = (data: CreateClientData) => createMutation.mutate(data);
  const updateClient = (id: string, data: UpdateClientData) => updateMutation.mutate({ id, data });
  const deleteClient = (id: string) => deleteMutation.mutate(id);

  return {
    clients: clients || [],
    loading,
    error,
    createClient,
    updateClient,
    deleteClient,
    getClientsBySearch: (filters: ClientFilters) => clientsService.getClients(filters),
    getClientById: (id: string) => clientsService.getClientById(id),
    refresh,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
}