/**
 * ElevenLabs Conversations Hook
 * Manages conversation data, transcripts, and audio from ElevenLabs
 */

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import type { Conversation, Transcript, Audio } from '@/features/elevenlabs/types';

// Extend Conversation with message_count for local use
interface ConversationWithCount extends Conversation {
  message_count?: number;
}

export const useElevenLabsConversations = (voiceAgentId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { session, userRole } = useAuth();

  // Fetch conversations with transcript counts
  const { data: conversations, isLoading: loadingConversations, error: conversationsError } = useQuery({
    queryKey: ['elevenlabs-conversations', voiceAgentId],
    enabled: !!session && (userRole === 'super_admin' || userRole === 'admin'),
    refetchInterval: 30_000,
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
      
      // Fetch transcript counts via RPC (single query instead of fetching all rows)
      if (conversationsData && conversationsData.length > 0) {
        const conversationIds = conversationsData.map(c => c.id);
        
        const { data: countData, error: countError } = await supabase
          .rpc('get_conversation_message_counts', { conversation_ids: conversationIds });

        const messageCounts: Record<string, number> = {};
        if (countError) {
          logger.error('Error fetching message counts', countError, 'ElevenLabs');
        } else if (countData) {
          for (const row of countData) {
            messageCounts[row.conversation_id] = Number(row.message_count);
          }
        }

        return conversationsData.map(conv => ({
          ...conv,
          message_count: messageCounts[conv.id] || 0
        })) as ConversationWithCount[];
      }

      return [];
    },
  });

  // Realtime subscription for instant updates
  useEffect(() => {
    const channel = supabase
      .channel('elevenlabs-conversations-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'elevenlabs_conversations',
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['elevenlabs-conversations'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

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
