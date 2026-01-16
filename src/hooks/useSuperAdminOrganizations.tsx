import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { logger } from '@/lib/logger';

interface OrganizationWithStats {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  subscription_status: string;
  settings: any;
  user_count: number;
  job_count: number;
  application_count: number;
  monthly_spend: number;
}

interface CreateOrganizationData {
  name: string;
  slug: string;
  adminEmail?: string;
}

interface UpdateOrganizationData {
  id: string;
  name?: string;
  slug?: string;
  subscription_status?: string;
  settings?: any;
}

export const useSuperAdminOrganizations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const organizationsQuery = useQuery({
    queryKey: ['super-admin-organizations'],
    queryFn: async (): Promise<OrganizationWithStats[]> => {
      const { data: organizations } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (!organizations) return [];

      // Get detailed stats for each organization
      const organizationsWithStats = await Promise.all(
        organizations.map(async (org) => {
          const { data, error } = await supabase.rpc('get_organization_with_stats', {
            _org_id: org.id
          });

          if (error) {
            logger.error('Error fetching org stats', error, { organizationId: org.id });
            return {
              ...org,
              user_count: 0,
              job_count: 0,
              application_count: 0,
              monthly_spend: 0,
            };
          }

          return data ? (data as unknown as OrganizationWithStats) : {
            ...org,
            user_count: 0,
            job_count: 0,
            application_count: 0,
            monthly_spend: 0,
          } as OrganizationWithStats;
        })
      );

      return organizationsWithStats;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const createOrganizationMutation = useMutation({
    mutationFn: async (data: CreateOrganizationData) => {
      const { data: orgId, error } = await supabase.rpc('create_organization', {
        _name: data.name,
        _slug: data.slug,
        _admin_email: data.adminEmail || null,
      });

      if (error) throw error;
      return orgId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-organizations'] });
      toast({
        title: 'Organization Created',
        description: 'The organization has been successfully created.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create organization',
        variant: 'destructive',
      });
    },
  });

  const updateOrganizationMutation = useMutation({
    mutationFn: async (data: UpdateOrganizationData) => {
      const { id, ...updates } = data;
      
      const { error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-organizations'] });
      toast({
        title: 'Organization Updated',
        description: 'The organization has been successfully updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update organization',
        variant: 'destructive',
      });
    },
  });

  const deleteOrganizationMutation = useMutation({
    mutationFn: async (organizationId: string) => {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', organizationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-organizations'] });
      toast({
        title: 'Organization Deleted',
        description: 'The organization has been successfully deleted.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete organization',
        variant: 'destructive',
      });
    },
  });

  return {
    organizations: organizationsQuery.data || [],
    isLoading: organizationsQuery.isLoading,
    error: organizationsQuery.error,
    createOrganization: createOrganizationMutation.mutate,
    updateOrganization: updateOrganizationMutation.mutate,
    deleteOrganization: deleteOrganizationMutation.mutate,
    isCreating: createOrganizationMutation.isPending,
    isUpdating: updateOrganizationMutation.isPending,
    isDeleting: deleteOrganizationMutation.isPending,
  };
};