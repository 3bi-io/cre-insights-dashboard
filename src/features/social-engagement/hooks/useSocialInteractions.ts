import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SocialPlatform } from './useSocialConnections';

export type InteractionStatus = 'pending' | 'processing' | 'responded' | 'escalated' | 'ignored' | 'archived';
export type IntentType = 'job_inquiry' | 'support' | 'complaint' | 'spam' | 'general' | 'application_status' | 'salary_question' | 'benefits_question';
export type SentimentLabel = 'positive' | 'neutral' | 'negative';

export interface SocialInteraction {
  id: string;
  organization_id: string;
  platform: SocialPlatform;
  interaction_type: string;
  sender_id: string;
  sender_name: string | null;
  sender_handle: string | null;
  sender_avatar_url: string | null;
  content: string;
  intent_classification: IntentType | null;
  intent_confidence: number | null;
  sentiment_label: SentimentLabel | null;
  is_job_related: boolean;
  requires_response: boolean;
  requires_human_review: boolean;
  review_reason: string | null;
  auto_responded: boolean;
  status: InteractionStatus;
  created_at: string;
  responded_at: string | null;
}

export interface SocialResponse {
  id: string;
  interaction_id: string;
  content: string;
  response_type: 'auto' | 'manual' | 'template' | 'edited_auto';
  ai_provider: string | null;
  status: string;
  sent_at: string | null;
  created_at: string;
}

interface UseInteractionsOptions {
  organizationId?: string;
  platform?: SocialPlatform;
  status?: InteractionStatus;
  requiresReview?: boolean;
  limit?: number;
}

export function useSocialInteractions(options: UseInteractionsOptions = {}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organizationId, platform, status, requiresReview, limit = 50 } = options;

  const { data: interactions, isLoading, error, refetch } = useQuery({
    queryKey: ['social-interactions', options],
    queryFn: async () => {
      let query = supabase
        .from('social_interactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }
      if (platform) {
        query = query.eq('platform', platform);
      }
      if (status) {
        query = query.eq('status', status);
      }
      if (requiresReview !== undefined) {
        query = query.eq('requires_human_review', requiresReview);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SocialInteraction[];
    },
    enabled: !!organizationId,
    refetchInterval: 60000, // Refresh every 60 seconds
    refetchIntervalInBackground: false,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ interactionId, newStatus }: { interactionId: string; newStatus: InteractionStatus }) => {
      const { error } = await supabase
        .from('social_interactions')
        .update({ status: newStatus })
        .eq('id', interactionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-interactions'] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const markAsIgnored = useMutation({
    mutationFn: async (interactionId: string) => {
      const { error } = await supabase
        .from('social_interactions')
        .update({ status: 'ignored', requires_response: false })
        .eq('id', interactionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-interactions'] });
      toast({ title: 'Interaction marked as ignored' });
    },
  });

  const escalate = useMutation({
    mutationFn: async ({ interactionId, reason }: { interactionId: string; reason: string }) => {
      const { error } = await supabase
        .from('social_interactions')
        .update({ 
          status: 'escalated', 
          requires_human_review: true,
          review_reason: reason,
        })
        .eq('id', interactionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-interactions'] });
      toast({ title: 'Interaction escalated for review' });
    },
  });

  return {
    interactions: interactions || [],
    isLoading,
    error,
    refetch,
    updateStatus,
    markAsIgnored,
    escalate,
  };
}

export function useSocialResponses(interactionId?: string) {
  const { data: responses, isLoading } = useQuery({
    queryKey: ['social-responses', interactionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_responses')
        .select('*')
        .eq('interaction_id', interactionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SocialResponse[];
    },
    enabled: !!interactionId,
  });

  return { responses: responses || [], isLoading };
}
