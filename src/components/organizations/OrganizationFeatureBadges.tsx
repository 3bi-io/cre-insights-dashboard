import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  Phone, 
  Share2, 
  BarChart3, 
  Zap,
  Crown 
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
    premium: true
  },
  openai_access: {
    label: 'OpenAI',
    icon: Bot,
    variant: 'secondary' as const,
    premium: true
  },
  anthropic_access: {
    label: 'Anthropic',
    icon: Zap,
    variant: 'secondary' as const,
    premium: true
  },
  elevenlabs_access: {
    label: 'ElevenLabs',
    icon: Phone,
    variant: 'secondary' as const,
    premium: true
  },
  meta_integration: {
    label: 'Meta Ads',
    icon: Share2,
    variant: 'outline' as const,
    premium: false
  },
  voice_agent: {
    label: 'Voice Agent',
    icon: Phone,
    variant: 'default' as const,
    premium: true
  },
  advanced_analytics: {
    label: 'Analytics',
    icon: BarChart3,
    variant: 'outline' as const,
    premium: false
  }
};

export const OrganizationFeatureBadges = ({ 
  features, 
  showAll = false 
}: OrganizationFeatureBadgesProps) => {
  const enabledFeatures = Object.entries(features)
    .filter(([_, enabled]) => enabled)
    .map(([key]) => key as keyof typeof FEATURE_CONFIG);

  if (enabledFeatures.length === 0 && !showAll) {
    return (
      <Badge variant="outline" className="text-xs">
        Basic Plan
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
            {config.premium && isEnabled && (
              <Crown className="w-2 h-2 ml-1" />
            )}
          </Badge>
        );
      })}
    </div>
  );
};