import { useOrganizationFeatures } from '@/hooks/useOrganizationFeatures';

export const useAIFeatures = () => {
  const {
    hasOpenAIAccess,
    hasAnthropicAccess,
    hasVoiceAgent,
    hasElevenLabsAccess,
    hasAIAccess
  } = useOrganizationFeatures();

  const getFeatureStatus = () => {
    const features = [
      { name: 'OpenAI', enabled: hasOpenAIAccess() },
      { name: 'Anthropic', enabled: hasAnthropicAccess() },
      { name: 'Voice Agent', enabled: hasVoiceAgent() },
      { name: 'ElevenLabs', enabled: hasElevenLabsAccess() }
    ];

    const enabledCount = features.filter(f => f.enabled).length;
    const totalCount = features.length;

    return {
      features,
      enabledCount,
      totalCount,
      // Include voice features in the "any features" check
      hasAnyFeatures: hasAIAccess() || hasVoiceAgent() || hasElevenLabsAccess(),
      completionPercentage: Math.round((enabledCount / totalCount) * 100)
    };
  };

  return {
    ...useOrganizationFeatures(),
    getFeatureStatus
  };
};