import { useAuth } from './useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

interface OrganizationFeatures {
  tenstreet_access?: boolean;
  openai_access?: boolean;
  anthropic_access?: boolean;
  meta_integration?: boolean;
  voice_agent?: boolean;
  advanced_analytics?: boolean;
  elevenlabs_access?: boolean;
}

export const useOrganizationFeatures = () => {
  const { organization, userRole } = useAuth();

  // Fetch features from organization_features table
  const featuresQuery = useQuery({
    queryKey: ['organization-features', organization?.id],
    queryFn: async (): Promise<OrganizationFeatures> => {
      if (!organization?.id) return {};

      const { data, error } = await supabase
        .from('organization_features')
        .select('feature_name, enabled')
        .eq('organization_id', organization.id);

      if (error) throw error;

      // Convert array to object
      const featuresObj = (data || []).reduce((acc, feature) => {
        acc[feature.feature_name as keyof OrganizationFeatures] = feature.enabled;
        return acc;
      }, {} as OrganizationFeatures);

      return featuresObj;
    },
    enabled: !!organization?.id,
  });

  // Get features from query or fallback to empty object
  const features = useMemo(() => {
    return featuresQuery.data || {} as OrganizationFeatures;
  }, [featuresQuery.data]);

  // Super admins have access to all features
  const hasFeature = (featureKey: keyof OrganizationFeatures): boolean => {
    if (userRole === 'super_admin') return true;
    return features?.[featureKey] || false;
  };

  // Feature check functions
  const hasTenstreetAccess = () => hasFeature('tenstreet_access');
  const hasOpenAIAccess = () => hasFeature('openai_access');
  const hasAnthropicAccess = () => hasFeature('anthropic_access');
  const hasMetaIntegration = () => hasFeature('meta_integration');
  const hasVoiceAgent = () => hasFeature('voice_agent');
  const hasAdvancedAnalytics = () => hasFeature('advanced_analytics');
  const hasElevenLabsAccess = () => hasFeature('elevenlabs_access');

  // AI access (either OpenAI or Anthropic)
  const hasAIAccess = () => hasOpenAIAccess() || hasAnthropicAccess();

  return {
    features: features || {},
    isLoading: featuresQuery.isLoading,
    hasFeature,
    hasTenstreetAccess,
    hasOpenAIAccess,
    hasAnthropicAccess,
    hasMetaIntegration,
    hasVoiceAgent,
    hasAdvancedAnalytics,
    hasElevenLabsAccess,
    hasAIAccess,
  };
};