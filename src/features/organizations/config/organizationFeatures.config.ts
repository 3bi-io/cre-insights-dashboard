import { FeatureConfig, FeatureKey } from '../types/features.types';
import { Bot, Megaphone, Share2, BarChart3, Mic, Zap, Brain } from 'lucide-react';

/**
 * Centralized feature configuration
 * This is the single source of truth for all organization features
 */
export const ORGANIZATION_FEATURES: Record<FeatureKey, FeatureConfig> = {
  meta_integration: {
    key: 'meta_integration',
    name: 'meta_integration',
    label: 'Meta Integration',
    description: 'Enable Meta/Facebook advertising integration for job postings',
    category: 'Advertising',
    premium: true,
    requiresSubscription: true,
  },
  openai_access: {
    key: 'openai_access',
    name: 'openai_access',
    label: 'OpenAI Access',
    description: 'Access to OpenAI GPT models for AI-powered features',
    category: 'AI',
    premium: true,
  },
  anthropic_access: {
    key: 'anthropic_access',
    name: 'anthropic_access',
    label: 'Anthropic Access',
    description: 'Access to Anthropic Claude models for AI-powered features',
    category: 'AI',
    premium: true,
  },
  grok_access: {
    key: 'grok_access',
    name: 'grok_access',
    label: 'xAI Grok Access',
    description: 'Access to xAI Grok models with real-time knowledge',
    category: 'AI',
    premium: true,
  },
  tenstreet_access: {
    key: 'tenstreet_access',
    name: 'tenstreet_access',
    label: 'Tenstreet Integration',
    description: 'Integration with Tenstreet ATS for application management',
    category: 'Integration',
    premium: true,
  },
  voice_agent: {
    key: 'voice_agent',
    name: 'voice_agent',
    label: 'Voice Agent',
    description: 'AI voice agent for applicant screening and communication',
    category: 'AI',
    premium: true,
  },
  elevenlabs_access: {
    key: 'elevenlabs_access',
    name: 'elevenlabs_access',
    label: 'ElevenLabs Voice AI',
    description: 'Access to ElevenLabs voice synthesis and conversational AI',
    category: 'AI',
    premium: true,
  },
  advanced_analytics: {
    key: 'advanced_analytics',
    name: 'advanced_analytics',
    label: 'Advanced Analytics',
    description: 'Advanced reporting and analytics features',
    category: 'Analytics',
    premium: true,
  },
};

/**
 * Get all available features as an array
 */
export const getAllFeatures = (): FeatureConfig[] => {
  return Object.values(ORGANIZATION_FEATURES);
};

/**
 * Get features grouped by category
 */
export const getFeaturesByCategory = () => {
  const features = getAllFeatures();
  return features.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, FeatureConfig[]>);
};

/**
 * Get feature configuration by key
 */
export const getFeatureConfig = (key: FeatureKey): FeatureConfig | undefined => {
  return ORGANIZATION_FEATURES[key];
};

/**
 * Validate if a string is a valid feature key
 */
export const isValidFeatureKey = (key: string): key is FeatureKey => {
  return key in ORGANIZATION_FEATURES;
};

/**
 * Get icon for feature (for backward compatibility)
 */
export const getFeatureIcon = (featureName: FeatureKey) => {
  switch (featureName) {
    case 'openai_access':
    case 'anthropic_access':
      return Bot;
    case 'grok_access':
      return Brain;
    case 'meta_integration':
      return Megaphone;
    case 'tenstreet_access':
      return Share2;
    case 'advanced_analytics':
      return BarChart3;
    case 'voice_agent':
      return Mic;
    case 'elevenlabs_access':
      return Zap;
    default:
      return Bot;
  }
};

/**
 * Get category badge styling
 */
export const getCategoryColor = (category: string) => {
  switch (category) {
    case 'AI':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'Advertising':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Integration':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Analytics':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};
