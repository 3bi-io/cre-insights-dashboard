/**
 * ElevenLabs Conversations Hook
 * Manages conversation data, transcripts, and audio from ElevenLabs
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

interface Conversation {
  id: string;
  organization_id: string;
  voice_agent_id: string;
  conversation_id: string;
  agent_id: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  metadata: Record<string, unknown>;
  message_count?: number;
  voice_agents?: {
    agent_name: string;
    organizations?: {
      name: string;
    };
  };
}

interface Transcript {
  id: string;
  conversation_id: string;
  speaker: string;
  message: string;
  timestamp: string;
  sequence_number: number;
  confidence_score: number | null;
}

interface Audio {
  id: string;
  conversation_id: string;
  audio_url: string;
  duration_seconds: number | null;
  file_size_bytes: number | null;
  format: string;
}

export const useElevenLabsConversations = (voiceAgentId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { session, userRole } = useAuth();

  // Fetch conversations with transcript counts
  const { data: conversations, isLoading: loadingConversations, error: conversationsError } = useQuery({
    queryKey: ['elevenlabs-conversations', voiceAgentId],
    enabled: !!session && (userRole === 'super_admin' || userRole === 'admin'),
    queryFn: async () => {
      logger.debug('Fetching ElevenLabs conversations', { agentId: voiceAgentId || 'all' }, 'ElevenLabs');
      let query = supabase
        .from('elevenlabs_conversations')
        .select(`
          *,
          voice_agents (
            agent_name,
            organizations (
              name
            )
          )
        `)
        .order('started_at', { ascending: false });

      if (voiceAgentId) {
        query = query.eq('voice_agent_id', voiceAgentId);
      }

      const { data: conversationsData, error } = await query;

      if (error) {
        logger.error('Error fetching conversations', error, 'ElevenLabs');
        throw error;
      }
      
      logger.debug('Fetched conversations', { count: conversationsData?.length || 0 }, 'ElevenLabs');
      
      // Fetch transcript counts for each conversation
      if (conversationsData && conversationsData.length > 0) {
        const conversationIds = conversationsData.map(c => c.id);
        
        const { data: transcriptCounts, error: countError } = await supabase
          .from('elevenlabs_transcripts')
          .select('conversation_id')
          .in('conversation_id', conversationIds);

        if (countError) {
          logger.error('Error fetching transcript counts', countError, 'ElevenLabs');
        }

        // Count messages per conversation
        const messageCounts = transcriptCounts?.reduce((acc, t) => {
          acc[t.conversation_id] = (acc[t.conversation_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

        // Return all conversations with message count
        return conversationsData.map(conv => ({
          ...conv,
          message_count: messageCounts[conv.id] || 0
        })) as Conversation[];
      }

      return [];
    },
  });

  // Fetch transcript for a conversation
  const fetchTranscript = async (conversationDbId: string) => {
    const { data, error } = await supabase
      .from('elevenlabs_transcripts')
      .select('*')
      .eq('conversation_id', conversationDbId)
      .order('sequence_number', { ascending: true });

    if (error) throw error;
    return data as Transcript[];
  };

  // Fetch audio for a conversation
  const fetchAudio = async (conversationDbId: string) => {
    const { data, error } = await supabase
      .from('elevenlabs_audio')
      .select('*')
      .eq('conversation_id', conversationDbId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data as Audio | null;
  };

  // Sync conversations from ElevenLabs
  const syncConversationsMutation = useMutation({
    mutationFn: async (agentId: string) => {
      const { data, error } = await supabase.functions.invoke('elevenlabs-conversations', {
        body: { action: 'list_conversations', agentId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elevenlabs-conversations'] });
      toast({
        title: "Conversations synced",
        description: "Successfully synced conversations from ElevenLabs.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync failed",
        description: error.message || "Failed to sync conversations.",
        variant: "destructive",
      });
    },
  });

  // Fetch and store transcript
  const fetchTranscriptMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      const { data, error } = await supabase.functions.invoke('elevenlabs-conversations', {
        body: { action: 'get_transcript', conversationId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elevenlabs-transcripts'] });
      toast({
        title: "Transcript loaded",
        description: "Conversation transcript loaded successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to load transcript",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Download audio
  const downloadAudioMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      const { data, error } = await supabase.functions.invoke('elevenlabs-conversations', {
        body: { action: 'get_audio', conversationId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Audio downloaded",
        description: "Conversation audio downloaded successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    conversations,
    loadingConversations,
    conversationsError,
    syncConversations: syncConversationsMutation.mutate,
    isSyncing: syncConversationsMutation.isPending,
    fetchTranscript,
    fetchTranscriptFromApi: fetchTranscriptMutation.mutate,
    fetchTranscriptFromApiAsync: fetchTranscriptMutation.mutateAsync,
    isFetchingTranscript: fetchTranscriptMutation.isPending,
    fetchAudio,
    downloadAudio: downloadAudioMutation.mutate,
    isDownloadingAudio: downloadAudioMutation.isPending,
  };
};
