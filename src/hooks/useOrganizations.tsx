import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  domain?: string;
  settings?: any;
  subscription_status: string;
  created_at: string;
  updated_at: string;
}

interface CreateOrganizationData {
  name: string;
  slug: string;
  logo_url?: string;
  domain?: string;
  settings?: any;
}

interface UpdateOrganizationData extends Partial<CreateOrganizationData> {
  id: string;
}

export const useOrganizations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userRole } = useAuth();

  // Admin-only: view all organizations
  const { data: organizations, isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      console.log('Fetching organizations...');
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Error fetching organizations:', error);
        throw error;
      }
      
      console.log('Organizations fetched:', data?.length);
      return data as Organization[];
    },
    enabled: userRole === 'admin', // Only admins can view all organizations
  });

  // Create organization (admin-only)
  const createOrganizationMutation = useMutation({
    mutationFn: async (organizationData: CreateOrganizationData) => {
      const { data, error } = await supabase
        .from('organizations')
        .insert(organizationData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast({
        title: "Success",
        description: "Organization created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create organization.",
        variant: "destructive",
      });
    },
  });

  // Update organization (admin-only)
  const updateOrganizationMutation = useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateOrganizationData) => {
      const { data, error } = await supabase
        .from('organizations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast({
        title: "Success",
        description: "Organization updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update organization.",
        variant: "destructive",
      });
    },
  });

  // Delete organization (admin-only)
  const deleteOrganizationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast({
        title: "Success",
        description: "Organization deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete organization.",
        variant: "destructive",
      });
    },
  });

  return {
    organizations,
    isLoading,
    createOrganization: createOrganizationMutation.mutate,
    updateOrganization: updateOrganizationMutation.mutate,
    deleteOrganization: deleteOrganizationMutation.mutate,
    isCreating: createOrganizationMutation.isPending,
    isUpdating: updateOrganizationMutation.isPending,
    isDeleting: deleteOrganizationMutation.isPending,
  };
};