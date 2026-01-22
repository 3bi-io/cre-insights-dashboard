/**
 * ElevenLabs API Hook
 * Provides hooks for interacting with ElevenLabs API endpoints
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { queryKeys } from '@/lib/queryKeys';

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  labels: Record<string, string>;
  description: string;
  preview_url: string;
  available_for_tiers: string[];
  settings: {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost?: boolean;
  } | null;
  samples: { sample_id: string; file_name: string; mime_type: string; size_bytes: number; hash: string }[];
  fine_tuning?: {
    is_allowed_to_fine_tune: boolean;
    model_id: string;
  };
}

interface ElevenLabsSubscription {
  tier: string;
  character_count: number;
  character_limit: number;
  can_extend_character_limit: boolean;
  allowed_to_extend_character_limit: boolean;
  next_character_count_reset_unix: number;
  voice_limit: number;
  max_voice_add_edits: number;
  professional_voice_limit: number;
  can_extend_voice_limit: boolean;
  can_use_instant_voice_cloning: boolean;
  can_use_professional_voice_cloning: boolean;
  currency: string;
  status: string;
}

interface ElevenLabsUser {
  subscription: ElevenLabsSubscription;
  xi_api_key: string;
  first_name: string;
}

interface ElevenLabsModel {
  model_id: string;
  name: string;
  description: string;
  can_be_finetuned: boolean;
  can_do_text_to_speech: boolean;
  can_do_voice_conversion: boolean;
  can_use_style: boolean;
  can_use_speaker_boost: boolean;
  serves_pro_voices: boolean;
  token_cost_factor: number;
  languages: { language_id: string; name: string }[];
}

async function callElevenLabsAPI<T>(action: string, params: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke('elevenlabs-api', {
    body: { action, ...params }
  });

  if (error) throw new Error(error.message);
  if (!data.success) throw new Error(data.error || 'Unknown error');
  
  return data;
}

export function useElevenLabsConnection() {
  return useQuery({
    queryKey: ['elevenlabs', 'connection'],
    queryFn: async () => {
      const data = await callElevenLabsAPI<{ success: boolean; user: ElevenLabsUser }>('test_connection');
      return data.user;
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
}

export function useElevenLabsSubscription() {
  return useQuery({
    queryKey: ['elevenlabs', 'subscription'],
    queryFn: async () => {
      const data = await callElevenLabsAPI<{ success: boolean; subscription: ElevenLabsSubscription }>('get_subscription');
      return data.subscription;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useElevenLabsVoices() {
  return useQuery({
    queryKey: ['elevenlabs', 'voices'],
    queryFn: async () => {
      const data = await callElevenLabsAPI<{ success: boolean; voices: ElevenLabsVoice[] }>('get_voices');
      return data.voices;
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useElevenLabsModels() {
  return useQuery({
    queryKey: ['elevenlabs', 'models'],
    queryFn: async () => {
      const data = await callElevenLabsAPI<{ success: boolean; models: ElevenLabsModel[] }>('get_models');
      return data.models;
    },
    staleTime: 30 * 60 * 1000,
  });
}

export function useElevenLabsHistory() {
  return useQuery({
    queryKey: ['elevenlabs', 'history'],
    queryFn: async () => {
      const data = await callElevenLabsAPI<{ success: boolean; history: { history: unknown[] } }>('get_history');
      return data.history;
    },
    staleTime: 1 * 60 * 1000,
  });
}

export function useElevenLabsAgents() {
  return useQuery({
    queryKey: ['elevenlabs', 'agents'],
    queryFn: async () => {
      const data = await callElevenLabsAPI<{ success: boolean; agents: unknown[] }>('get_agents');
      return data.agents;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useTextToSpeech() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      voiceId: string;
      text: string;
      modelId?: string;
      voiceSettings?: {
        stability: number;
        similarity_boost: number;
        style?: number;
        use_speaker_boost?: boolean;
      };
    }) => {
      const data = await callElevenLabsAPI<{ success: boolean; audio: string; contentType: string }>('text_to_speech', params);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elevenlabs', 'subscription'] });
      toast({ title: 'Speech generated successfully' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Failed to generate speech', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
}

export function useConnectionTest() {
  return useMutation({
    mutationFn: async () => {
      const data = await callElevenLabsAPI<{ success: boolean; user: ElevenLabsUser }>('test_connection');
      return data.user;
    },
    onSuccess: () => {
      toast({ title: 'Connection successful', description: 'ElevenLabs API is connected and working' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Connection failed', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
}

export type { ElevenLabsVoice, ElevenLabsSubscription, ElevenLabsUser, ElevenLabsModel };
