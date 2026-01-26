import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { SocialBeaconConfigRecord, PlatformConnectionStatus } from '../types/adCreative.types';
import { SOCIAL_BEACONS, type SocialBeaconPlatform } from '../config/socialBeacons.config';

/**
 * Hook for managing social beacon platform configurations
 */
export function useSocialBeaconConfig(organizationId?: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all platform configurations
  const { data: configs, isLoading, error } = useQuery({
    queryKey: ['social-beacon-configs', organizationId],
    queryFn: async () => {
      let query = supabase
        .from('social_beacon_configurations')
        .select('*')
        .order('platform');

      // For super admin, get global configs (null org) or specific org
      if (organizationId === null) {
        query = query.is('organization_id', null);
      } else if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SocialBeaconConfigRecord[];
    },
  });

  // Get configuration for a specific platform
  const getConfigByPlatform = (platform: SocialBeaconPlatform): SocialBeaconConfigRecord | undefined => {
    return configs?.find(c => c.platform === platform);
  };

  // Upsert platform configuration
  const upsertConfig = useMutation({
    mutationFn: async (config: Partial<SocialBeaconConfigRecord> & { platform: SocialBeaconPlatform }) => {
      const existingConfig = getConfigByPlatform(config.platform);
      
      const upsertData = {
        id: existingConfig?.id || undefined,
        platform: config.platform,
        organization_id: organizationId || null,
        oauth_client_id: config.oauth_client_id,
        oauth_redirect_uri: config.oauth_redirect_uri,
        oauth_scopes: config.oauth_scopes,
        webhook_url: config.webhook_url,
        webhook_secret: config.webhook_secret,
        auto_engage_enabled: config.auto_engage_enabled ?? false,
        ad_creative_enabled: config.ad_creative_enabled ?? false,
        settings: config.settings || {},
      };

      // Remove undefined id to let database generate it
      type UpsertType = typeof upsertData;
      const cleanData: UpsertType = existingConfig?.id 
        ? upsertData 
        : { ...upsertData, id: undefined };

      const { data, error } = await supabase
        .from('social_beacon_configurations')
        .upsert(cleanData as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['social-beacon-configs'] });
      toast({
        title: 'Configuration saved',
        description: `${SOCIAL_BEACONS[variables.platform].name} settings updated.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Failed to save configuration',
        variant: 'destructive',
      });
    },
  });

  // Toggle feature flag
  const toggleFeature = useMutation({
    mutationFn: async ({ 
      platform, 
      feature, 
      enabled 
    }: { 
      platform: SocialBeaconPlatform; 
      feature: 'auto_engage_enabled' | 'ad_creative_enabled'; 
      enabled: boolean;
    }) => {
      const existingConfig = getConfigByPlatform(platform);
      
      const { error } = await supabase
        .from('social_beacon_configurations')
        .upsert({
          id: existingConfig?.id,
          platform,
          organization_id: organizationId || null,
          [feature]: enabled,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'platform,organization_id',
        });

      if (error) throw error;
    },
    onSuccess: (_, { platform, feature, enabled }) => {
      queryClient.invalidateQueries({ queryKey: ['social-beacon-configs'] });
      const featureName = feature === 'auto_engage_enabled' ? 'Auto-engage' : 'Ad creative';
      toast({
        title: `${featureName} ${enabled ? 'enabled' : 'disabled'}`,
        description: `${SOCIAL_BEACONS[platform].name} ${featureName.toLowerCase()} has been ${enabled ? 'enabled' : 'disabled'}.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update feature',
        variant: 'destructive',
      });
    },
  });

  // Delete platform configuration
  const deleteConfig = useMutation({
    mutationFn: async (platform: SocialBeaconPlatform) => {
      const config = getConfigByPlatform(platform);
      if (!config) return;

      const { error } = await supabase
        .from('social_beacon_configurations')
        .delete()
        .eq('id', config.id);

      if (error) throw error;
    },
    onSuccess: (_, platform) => {
      queryClient.invalidateQueries({ queryKey: ['social-beacon-configs'] });
      toast({
        title: 'Configuration removed',
        description: `${SOCIAL_BEACONS[platform].name} configuration has been deleted.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Failed to delete configuration',
        variant: 'destructive',
      });
    },
  });

  // Get connection status for all platforms (mock - actual secret checking would need edge function)
  const getPlatformStatuses = (): PlatformConnectionStatus[] => {
    return Object.values(SOCIAL_BEACONS).map(beacon => {
      const config = getConfigByPlatform(beacon.platform);
      
      return {
        platform: beacon.platform,
        isConnected: config?.auto_engage_enabled || config?.ad_creative_enabled || false,
        configuredSecrets: [], // Would need edge function to check actual secrets
        missingSecrets: beacon.requiredSecrets,
        lastVerified: config?.webhook_verified_at || undefined,
        error: undefined,
      };
    });
  };

  return {
    configs: configs || [],
    isLoading,
    error,
    getConfigByPlatform,
    upsertConfig,
    toggleFeature,
    deleteConfig,
    getPlatformStatuses,
  };
}
