import React from 'react';
import { useOrganizationFeatures } from '@/hooks/useOrganizationFeatures';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Lock, 
  Crown, 
  ExternalLink,
  AlertTriangle 
} from 'lucide-react';

interface FeatureGuardProps {
  feature: 'tenstreet_access' | 'openai_access' | 'anthropic_access' | 'grok_access' | 'meta_integration' | 'voice_agent' | 'advanced_analytics' | 'elevenlabs_access' | 'background_check_access';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
  featureName?: string;
}

const FEATURE_NAMES = {
  tenstreet_access: 'Tenstreet Integration',
  openai_access: 'OpenAI API',
  anthropic_access: 'Anthropic API',
  grok_access: 'xAI Grok API',
  meta_integration: 'Meta Advertising',
  voice_agent: 'Voice Agent',
  advanced_analytics: 'Advanced Analytics',
  elevenlabs_access: 'ElevenLabs Voice AI',
  background_check_access: 'Background Check Integration'
};

export const FeatureGuard: React.FC<FeatureGuardProps> = ({
  feature,
  children,
  fallback,
  showUpgrade = true,
  featureName
}) => {
  const { hasFeature, isLoading } = useOrganizationFeatures();

  // Show loading state
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-muted rounded-lg"></div>
      </div>
    );
  }

  // Check if user has access to this feature
  const hasAccess = hasFeature(feature);

  // If user has access, render children
  if (hasAccess) {
    return <>{children}</>;
  }

  // If user doesn't have access, show fallback or upgrade prompt
  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgrade) {
    return null;
  }

  const displayName = featureName || FEATURE_NAMES[feature];

  return (
    <div className="p-6 border-2 border-dashed border-muted rounded-lg bg-muted/50">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center">
          <div className="p-3 bg-background rounded-full border">
            <Lock className="w-6 h-6 text-muted-foreground" />
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2 flex items-center justify-center gap-2">
            {displayName} Required
            <Badge variant="secondary" className="text-xs">
              <Crown className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            This feature requires {displayName} access. Contact your administrator to enable this feature for your organization.
          </p>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Organization Administrators:</strong> You can enable this feature from the Organizations management panel.
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled>
            <ExternalLink className="w-4 h-4 mr-2" />
            Contact Administrator
          </Button>
        </div>
      </div>
    </div>
  );
};

// Convenience hook for checking multiple features
export const useFeatureGuard = () => {
  const { hasFeature } = useOrganizationFeatures();
  
  return {
    canAccessTenstreet: () => hasFeature('tenstreet_access'),
    canAccessOpenAI: () => hasFeature('openai_access'),
    canAccessAnthropic: () => hasFeature('anthropic_access'),
    canAccessGrok: () => hasFeature('grok_access'),
    canAccessMetaAds: () => hasFeature('meta_integration'),
    canAccessVoiceAgent: () => hasFeature('voice_agent'),
    canAccessAdvancedAnalytics: () => hasFeature('advanced_analytics'),
    canAccessElevenLabs: () => hasFeature('elevenlabs_access'),
    canAccessBackgroundChecks: () => hasFeature('background_check_access'),
    hasFeature
  };
};