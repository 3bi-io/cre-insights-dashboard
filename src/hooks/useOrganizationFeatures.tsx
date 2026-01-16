import { useAuth } from './useAuth';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { OrganizationFeaturesService } from '@/features/organizations/services/organizationFeaturesService';
import {
  FeatureKey,
  OrganizationFeaturesMap,
} from '@/features/organizations/types/features.types';
import { logger } from '@/lib/logger';

/**
 * Hook for checking organization feature access
 * Used by regular users and components to verify feature availability
 */
export const useOrganizationFeatures = () => {
  const { organization, userRole } = useAuth();

  // Fetch features from organization_features table
  const featuresQuery = useQuery({
    queryKey: ['organization-features', organization?.id],
    queryFn: async (): Promise<OrganizationFeaturesMap> => {
      if (!organization?.id) return {};

      try {
        return await OrganizationFeaturesService.fetchOrganizationFeaturesMap(
          organization.id
        );
      } catch (error) {
        logger.error('Failed to fetch organization features:', error);
        return {};
      }
    },
    enabled: !!organization?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Get features from query or fallback to empty object
  const features = useMemo(() => {
    return featuresQuery.data || ({} as OrganizationFeaturesMap);
  }, [featuresQuery.data]);

  /**
   * Check if user has access to a specific feature
   * Super admins have access to all features
   */
  const hasFeature = (featureKey: FeatureKey): boolean => {
    if (userRole === 'super_admin') return true;
    return features?.[featureKey] || false;
  };

  // Feature check functions for backward compatibility
  const hasTenstreetAccess = () => hasFeature('tenstreet_access');
  const hasOpenAIAccess = () => hasFeature('openai_access');
  const hasAnthropicAccess = () => hasFeature('anthropic_access');
  const hasGrokAccess = () => hasFeature('grok_access');
  const hasMetaIntegration = () => hasFeature('meta_integration');
  const hasVoiceAgent = () => hasFeature('voice_agent');
  const hasAdvancedAnalytics = () => hasFeature('advanced_analytics');
  const hasElevenLabsAccess = () => hasFeature('elevenlabs_access');
  const hasBackgroundCheckAccess = () => hasFeature('background_check_access');

  // AI access (OpenAI, Anthropic, or Grok)
  const hasAIAccess = () =>
    hasOpenAIAccess() || hasAnthropicAccess() || hasGrokAccess();

  return {
    // Data
    features,
    
    // State
    isLoading: featuresQuery.isLoading,
    isError: featuresQuery.isError,
    error: featuresQuery.error,
    
    // Generic feature check
    hasFeature,
    
    // Specific feature checks (backward compatibility)
    hasTenstreetAccess,
    hasOpenAIAccess,
    hasAnthropicAccess,
    hasGrokAccess,
    hasMetaIntegration,
    hasVoiceAgent,
    hasAdvancedAnalytics,
    hasElevenLabsAccess,
    hasBackgroundCheckAccess,
    hasAIAccess,
  };
};
