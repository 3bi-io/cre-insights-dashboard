import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  Phone, 
  Share2, 
  BarChart3, 
  Zap,
  Sparkles 
} from 'lucide-react';

interface OrganizationFeatureBadgesProps {
  features: {
    tenstreet_access?: boolean;
    openai_access?: boolean;
    anthropic_access?: boolean;
    meta_integration?: boolean;
    voice_agent?: boolean;
    advanced_analytics?: boolean;
    elevenlabs_access?: boolean;
  };
  showAll?: boolean;
}

const FEATURE_CONFIG = {
  tenstreet_access: {
    label: 'Tenstreet',
    icon: Share2,
    variant: 'default' as const,
  },
  openai_access: {
    label: 'OpenAI',
    icon: Bot,
    variant: 'secondary' as const,
  },
  anthropic_access: {
    label: 'Anthropic',
    icon: Zap,
    variant: 'secondary' as const,
  },
  elevenlabs_access: {
    label: 'ElevenLabs',
    icon: Phone,
    variant: 'secondary' as const,
  },
  meta_integration: {
    label: 'Meta Ads',
    icon: Share2,
    variant: 'outline' as const,
  },
  voice_agent: {
    label: 'Voice Agent',
    icon: Phone,
    variant: 'default' as const,
  },
  advanced_analytics: {
    label: 'Analytics',
    icon: BarChart3,
    variant: 'outline' as const,
  }
};

export const OrganizationFeatureBadges = ({ 
  features, 
  showAll = false 
}: OrganizationFeatureBadgesProps) => {
  const enabledFeatures = Object.entries(features)
    .filter(([_, enabled]) => enabled)
    .map(([key]) => key as keyof typeof FEATURE_CONFIG)
    .filter(key => FEATURE_CONFIG[key]); // Only include keys that exist in our config

  if (enabledFeatures.length === 0 && !showAll) {
    return (
      <Badge variant="outline" className="text-xs">
        <Sparkles className="w-3 h-3 mr-1" />
        Standard
      </Badge>
    );
  }

  const featuresToShow = showAll 
    ? Object.keys(FEATURE_CONFIG) as (keyof typeof FEATURE_CONFIG)[]
    : enabledFeatures;

  return (
    <div className="flex flex-wrap gap-1">
      {featuresToShow.map((featureKey) => {
        const config = FEATURE_CONFIG[featureKey];
        const isEnabled = features[featureKey];
        
        // Safety check - skip if config doesn't exist
        if (!config) return null;
        
        const Icon = config.icon;
        
        if (!showAll && !isEnabled) return null;
        
        return (
          <Badge
            key={featureKey}
            variant={isEnabled ? config.variant : 'outline'}
            className={`text-xs ${!isEnabled ? 'opacity-50' : ''}`}
          >
            <Icon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        );
      })}
    </div>
  );
};
