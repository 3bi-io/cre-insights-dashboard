import { useQuery } from '@tanstack/react-query';

const SUPABASE_URL = "https://auwhcdpppldjlcaxzsme.supabase.co";

interface TranscriptMessage {
  id: string;
  speaker: string;
  message: string;
  timestamp: string;
  sequence_number: number;
}

interface SharedConversation {
  title: string;
  agent_name: string;
  organization: {
    name: string | null;
    logo_url: string | null;
  };
  started_at: string;
  duration_seconds: number | null;
  status: string;
  transcript: TranscriptMessage[];
  audio_url: string | null;
  hide_caller_info: boolean;
}

interface SharedConversationResponse {
  success: boolean;
  conversation?: SharedConversation;
  error?: string;
}

export function useSharedConversation(shareCode: string | undefined) {
  return useQuery<SharedConversationResponse>({
    queryKey: ['shared-conversation', shareCode],
    queryFn: async () => {
      if (!shareCode) {
        throw new Error('Share code is required');
      }

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/get-shared-conversation?code=${encodeURIComponent(shareCode)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Conversation not found');
      }

      return data;
    },
    enabled: !!shareCode,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 1,
  });
}

export type { SharedConversation, TranscriptMessage, SharedConversationResponse };
