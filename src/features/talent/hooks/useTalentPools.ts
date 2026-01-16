import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import type { Json } from '@/integrations/supabase/types';

export interface TalentPool {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  criteria: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

export interface TalentPoolMember {
  id: string;
  pool_id: string;
  application_id: string;
  added_by: string | null;
  notes: string | null;
  added_at: string;
  application?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    applicant_email: string | null;
    phone: string | null;
    city: string | null;
    state: string | null;
    cdl: string | null;
    exp: string | null;
    status: string | null;
    job_listings?: {
      title: string | null;
      organization_id: string | null;
    };
  };
}

async function fetchTalentPools(): Promise<TalentPool[]> {
  const { data, error } = await supabase
    .from('talent_pools')
    .select(`
      *,
      talent_pool_members(count)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((pool: any) => ({
    ...pool,
    member_count: pool.talent_pool_members?.[0]?.count || 0,
  }));
}

async function fetchPoolMembers(poolId: string): Promise<TalentPoolMember[]> {
  const { data, error } = await supabase
    .from('talent_pool_members')
    .select(`
      *,
      application:applications(
        id, first_name, last_name, applicant_email, phone, 
        city, state, cdl, exp, status,
        job_listings(title, organization_id)
      )
    `)
    .eq('pool_id', poolId)
    .order('added_at', { ascending: false });

  if (error) throw error;
  return (data || []) as TalentPoolMember[];
}

export function useTalentPools() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const poolsQuery = useQuery({
    queryKey: ['talent-pools'],
    queryFn: fetchTalentPools,
  });

  const createPoolMutation = useMutation({
    mutationFn: async (params: { name: string; description?: string; organizationId: string }) => {
      const { data, error } = await supabase
        .from('talent_pools')
        .insert([{
          name: params.name,
          description: params.description || null,
          organization_id: params.organizationId,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent-pools'] });
      toast({ title: 'Pool created', description: 'Talent pool created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Failed to create talent pool', variant: 'destructive' });
      logger.error('Create pool error', error);
    },
  });

  const deletePoolMutation = useMutation({
    mutationFn: async (poolId: string) => {
      const { error } = await supabase
        .from('talent_pools')
        .delete()
        .eq('id', poolId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent-pools'] });
      toast({ title: 'Pool deleted', description: 'Talent pool deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Failed to delete talent pool', variant: 'destructive' });
      logger.error('Delete pool error', error);
    },
  });

  return {
    pools: poolsQuery.data || [],
    isLoading: poolsQuery.isLoading,
    error: poolsQuery.error,
    createPool: createPoolMutation.mutateAsync,
    deletePool: deletePoolMutation.mutateAsync,
    isCreating: createPoolMutation.isPending,
    isDeleting: deletePoolMutation.isPending,
  };
}

export function useTalentPoolMembers(poolId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const membersQuery = useQuery({
    queryKey: ['talent-pool-members', poolId],
    queryFn: () => fetchPoolMembers(poolId!),
    enabled: !!poolId,
  });

  const addMemberMutation = useMutation({
    mutationFn: async (params: { poolId: string; applicationId: string; notes?: string }) => {
      const { data, error } = await supabase
        .from('talent_pool_members')
        .insert([{
          pool_id: params.poolId,
          application_id: params.applicationId,
          notes: params.notes || null,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent-pool-members', poolId] });
      queryClient.invalidateQueries({ queryKey: ['talent-pools'] });
      toast({ title: 'Candidate added', description: 'Candidate added to pool' });
    },
    onError: (error: any) => {
      if (error?.code === '23505') {
        toast({ title: 'Already in pool', description: 'This candidate is already in the pool', variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: 'Failed to add candidate to pool', variant: 'destructive' });
      }
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('talent_pool_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent-pool-members', poolId] });
      queryClient.invalidateQueries({ queryKey: ['talent-pools'] });
      toast({ title: 'Candidate removed', description: 'Candidate removed from pool' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Failed to remove candidate', variant: 'destructive' });
      logger.error('Remove member error', error);
    },
  });

  return {
    members: membersQuery.data || [],
    isLoading: membersQuery.isLoading,
    error: membersQuery.error,
    addMember: addMemberMutation.mutateAsync,
    removeMember: removeMemberMutation.mutateAsync,
    isAdding: addMemberMutation.isPending,
    isRemoving: removeMemberMutation.isPending,
  };
}
