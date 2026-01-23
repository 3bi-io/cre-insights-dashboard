/**
 * Voice Agents Hook
 * CRUD operations for voice agents
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { VoiceAgent, CreateVoiceAgentData, UpdateVoiceAgentData } from '@/features/elevenlabs';
import { logger } from '@/lib/logger';
import { queryKeys } from '@/lib/queryKeys';

export const useVoiceAgents = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userRole, organization } = useAuth();

  // Fetch voice agents with organization filtering for security
  const { data: voiceAgents, isLoading, error } = useQuery({
    queryKey: queryKeys.voiceAgents.list(organization?.id),
    queryFn: async () => {
      logger.debug('Fetching voice agents...', { orgId: organization?.id, userRole });
      
      let query = supabase
        .from('voice_agents')
        .select(`
          *,
          organizations (
            name,
            slug,
            logo_url
          )
        `)
        .order('created_at', { ascending: false });
      
      // Super admins can see all agents, others only their org's agents
      if (userRole !== 'super_admin' && organization?.id) {
        query = query.eq('organization_id', organization.id);
      }
      
      const { data, error } = await query;
      
      if (error) {
        logger.error('Error fetching voice agents:', error);
        throw error;
      }
      
      logger.debug('Voice agents fetched', { count: data?.length });
      return data as VoiceAgent[];
    },
    enabled: userRole === 'super_admin' || userRole === 'admin',
  });

  // Create voice agent mutation
  const createVoiceAgentMutation = useMutation({
    mutationFn: async (data: CreateVoiceAgentData) => {
      const { data: result, error } = await supabase
        .from('voice_agents')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.voiceAgents.all });
      toast({
        title: "Voice agent created",
        description: "Voice agent has been created successfully.",
      });
    },
    onError: (error) => {
      logger.error('Error creating voice agent:', error);
      toast({
        title: "Error",
        description: "Failed to create voice agent.",
        variant: "destructive",
      });
    },
  });

  // Update voice agent mutation
  const updateVoiceAgentMutation = useMutation({
    mutationFn: async ({ id, ...data }: UpdateVoiceAgentData) => {
      const { data: result, error } = await supabase
        .from('voice_agents')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.voiceAgents.all });
      toast({
        title: "Voice agent updated",
        description: "Voice agent has been updated successfully.",
      });
    },
    onError: (error) => {
      logger.error('Error updating voice agent:', error);
      toast({
        title: "Error",
        description: "Failed to update voice agent.",
        variant: "destructive",
      });
    },
  });

  // Delete voice agent mutation
  const deleteVoiceAgentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('voice_agents')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.voiceAgents.all });
      toast({
        title: "Voice agent deleted",
        description: "Voice agent has been deleted successfully.",
      });
    },
    onError: (error) => {
      logger.error('Error deleting voice agent:', error);
      toast({
        title: "Error",
        description: "Failed to delete voice agent.",
        variant: "destructive",
      });
    },
  });

  return {
    voiceAgents,
    isLoading,
    error,
    createVoiceAgent: createVoiceAgentMutation.mutate,
    updateVoiceAgent: updateVoiceAgentMutation.mutate,
    deleteVoiceAgent: deleteVoiceAgentMutation.mutate,
    isCreating: createVoiceAgentMutation.isPending,
    isUpdating: updateVoiceAgentMutation.isPending,
    isDeleting: deleteVoiceAgentMutation.isPending,
  };
};
