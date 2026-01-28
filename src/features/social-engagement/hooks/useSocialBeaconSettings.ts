import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Settings shape for global social beacon configuration
 */
export interface SocialBeaconSettings {
  // Auto-engage defaults
  autoRespondEnabled: boolean;
  humanReviewRequired: boolean;
  responseDelaySeconds: number;
  aiConfidenceThreshold: number;
  
  // Branding & voice
  companyName: string;
  brandVoice: 'professional' | 'friendly' | 'enthusiastic' | 'authoritative';
  defaultHashtags: string;
  callToActionUrl: string;
  
  // Default response templates
  templates: {
    jobInquiry: string;
    salaryQuestion: string;
    benefitsQuestion: string;
    generalInquiry: string;
  };
}

const DEFAULT_SETTINGS: SocialBeaconSettings = {
  autoRespondEnabled: false,
  humanReviewRequired: true,
  responseDelaySeconds: 30,
  aiConfidenceThreshold: 0.8,
  companyName: '',
  brandVoice: 'professional',
  defaultHashtags: '',
  callToActionUrl: '',
  templates: {
    jobInquiry: 'Thanks for your interest! We\'re always looking for great drivers. Apply at {apply_url} or call {phone}.',
    salaryQuestion: 'Great question! Our pay is competitive and depends on experience and route. Contact us at {phone} for specific details.',
    benefitsQuestion: 'We offer full benefits including health insurance, 401k, paid time off, and more. Learn more at {website}.',
    generalInquiry: 'Thanks for reaching out! For more information, visit {website} or call us at {phone}.',
  },
};

/**
 * Hook for managing global social beacon settings
 */
export function useSocialBeaconSettings(organizationId?: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch settings from organization or global config
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['social-beacon-settings', organizationId],
    queryFn: async (): Promise<SocialBeaconSettings> => {
      // Try to get settings from social_beacon_configurations with platform = 'global'
      let query = supabase
        .from('social_beacon_configurations')
        .select('settings')
        .eq('platform', 'x') // Use 'x' as the base config holder
        .limit(1);

      if (organizationId === null) {
        query = query.is('organization_id', null);
      } else if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error } = await query.single();
      
      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is fine
        throw error;
      }

      // Merge saved settings with defaults
      const savedSettings = (data?.settings as Partial<SocialBeaconSettings>) || {};
      return { ...DEFAULT_SETTINGS, ...savedSettings };
    },
  });

  // Save settings mutation
  const saveSettings = useMutation({
    mutationFn: async (newSettings: SocialBeaconSettings) => {
      // First check if a config exists for this org
      let query = supabase
        .from('social_beacon_configurations')
        .select('id')
        .eq('platform', 'x')
        .limit(1);

      if (organizationId === null) {
        query = query.is('organization_id', null);
      } else if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data: existing } = await query.single();

      if (existing?.id) {
        // Update existing
        const { error } = await supabase
          .from('social_beacon_configurations')
          .update({
            settings: JSON.parse(JSON.stringify(newSettings)),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new - cast to any to bypass strict typing
        const insertData = {
          platform: 'x' as const,
          organization_id: organizationId || null,
          settings: JSON.parse(JSON.stringify(newSettings)),
        };
        
        const { error } = await supabase
          .from('social_beacon_configurations')
          .insert(insertData as any);

        if (error) throw error;
      }

      return newSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-beacon-settings'] });
      toast({
        title: 'Settings saved',
        description: 'Global social beacon settings have been updated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Failed to save settings',
        variant: 'destructive',
      });
    },
  });

  // Reset to defaults
  const resetToDefaults = useMutation({
    mutationFn: async () => {
      return saveSettings.mutateAsync(DEFAULT_SETTINGS);
    },
  });

  return {
    settings: settings || DEFAULT_SETTINGS,
    isLoading,
    error,
    saveSettings,
    resetToDefaults,
    defaultSettings: DEFAULT_SETTINGS,
  };
}
