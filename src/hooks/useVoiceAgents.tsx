import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface VoiceAgent {
  id: string;
  organization_id: string;
  agent_name: string;
  agent_id: string;
  elevenlabs_agent_id: string;
  description: string | null;
  is_active: boolean;
  llm_model?: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  organizations?: {
    name: string;
    slug: string;
    logo_url?: string;
  };
}

interface CreateVoiceAgentData {
  organization_id: string;
  agent_name: string;
  agent_id: string;
  elevenlabs_agent_id: string;
  description?: string;
  is_active?: boolean;
  llm_model?: string;
}

interface UpdateVoiceAgentData extends Partial<CreateVoiceAgentData> {
  id: string;
}

export const useVoiceAgents = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userRole } = useAuth();

  // Fetch all voice agents with organization info
  const { data: voiceAgents, isLoading, error } = useQuery({
    queryKey: ['voice-agents'],
    queryFn: async () => {
      console.log('Fetching voice agents...');
      const { data, error } = await supabase
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
      
      if (error) {
        console.error('Error fetching voice agents:', error);
        throw error;
      }
      
      console.log('Voice agents fetched:', data?.length);
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
      queryClient.invalidateQueries({ queryKey: ['voice-agents'] });
      toast({
        title: "Voice agent created",
        description: "Voice agent has been created successfully.",
      });
    },
    onError: (error) => {
      console.error('Error creating voice agent:', error);
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
      queryClient.invalidateQueries({ queryKey: ['voice-agents'] });
      toast({
        title: "Voice agent updated",
        description: "Voice agent has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Error updating voice agent:', error);
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
      queryClient.invalidateQueries({ queryKey: ['voice-agents'] });
      toast({
        title: "Voice agent deleted",
        description: "Voice agent has been deleted successfully.",
      });
    },
    onError: (error) => {
      console.error('Error deleting voice agent:', error);
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