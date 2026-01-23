import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type SocialPlatform = 'facebook' | 'instagram' | 'whatsapp' | 'twitter' | 'linkedin';

export interface SocialConnection {
  id: string;
  organization_id: string;
  platform: SocialPlatform;
  platform_user_id: string | null;
  platform_username: string | null;
  page_id: string | null;
  page_name: string | null;
  is_active: boolean;
  auto_respond_enabled: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function useSocialConnections(organizationId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: connections, isLoading, error } = useQuery({
    queryKey: ['social-connections', organizationId],
    queryFn: async () => {
      let query = supabase
        .from('social_platform_connections')
        .select('*')
        .order('platform');

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SocialConnection[];
    },
    enabled: !!organizationId,
  });

  const toggleAutoRespond = useMutation({
    mutationFn: async ({ connectionId, enabled }: { connectionId: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('social_platform_connections')
        .update({ auto_respond_enabled: enabled })
        .eq('id', connectionId);

      if (error) throw error;
    },
    onSuccess: (_, { enabled }) => {
      queryClient.invalidateQueries({ queryKey: ['social-connections'] });
      toast({
        title: enabled ? 'Auto-respond enabled' : 'Auto-respond disabled',
        description: `AI responses will ${enabled ? 'now' : 'no longer'} be sent automatically.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update setting',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ connectionId, active }: { connectionId: string; active: boolean }) => {
      const { error } = await supabase
        .from('social_platform_connections')
        .update({ is_active: active })
        .eq('id', connectionId);

      if (error) throw error;
    },
    onSuccess: (_, { active }) => {
      queryClient.invalidateQueries({ queryKey: ['social-connections'] });
      toast({
        title: active ? 'Connection activated' : 'Connection paused',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update connection',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const getConnectionByPlatform = (platform: SocialPlatform) => {
    return connections?.find(c => c.platform === platform);
  };

  return {
    connections: connections || [],
    isLoading,
    error,
    toggleAutoRespond,
    toggleActive,
    getConnectionByPlatform,
  };
}
