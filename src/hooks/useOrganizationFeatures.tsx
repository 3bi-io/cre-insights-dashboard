import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';

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

  const { data: features, isLoading } = useQuery({
    queryKey: ['organization-features', organization?.id],
    queryFn: () => {
      if (!organization?.settings?.features) {
        return {} as OrganizationFeatures;
      }
      return organization.settings.features as OrganizationFeatures;
    },
    enabled: !!organization,
  });

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
    isLoading,
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