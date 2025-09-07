import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bot, 
  Phone, 
  Share2, 
  BarChart3, 
  Zap,
  Crown,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { useOrganizationFeatures } from '@/hooks/useOrganizationFeatures';

export const OrganizationFeatureStatus = () => {
  const {
    features,
    isLoading,
    hasTenstreetAccess,
    hasOpenAIAccess,
    hasAnthropicAccess,
    hasMetaIntegration,
    hasVoiceAgent,
    hasAdvancedAnalytics,
    hasElevenLabsAccess,
    hasAIAccess
  } = useOrganizationFeatures();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Feature Access Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const featureItems = [
    {
      key: 'ai_access',
      name: 'AI Integration',
      description: 'Access to AI-powered features and chat',
      enabled: hasAIAccess(),
      icon: Bot,
      premium: true,
      details: hasOpenAIAccess() && hasAnthropicAccess() ? 'OpenAI + Anthropic' : 
               hasOpenAIAccess() ? 'OpenAI Only' : 
               hasAnthropicAccess() ? 'Anthropic Only' : 'Not Available'
    },
    {
      key: 'tenstreet_access',
      name: 'Tenstreet Integration',
      description: 'ATS integration and applicant management',
      enabled: hasTenstreetAccess(),
      icon: Share2,
      premium: true
    },
    {
      key: 'voice_agent',
      name: 'Voice Agent',
      description: 'AI-powered voice screening',
      enabled: hasVoiceAgent(),
      icon: Phone,
      premium: true
    },
    {
      key: 'meta_integration',
      name: 'Meta Advertising',
      description: 'Facebook and Instagram campaigns',
      enabled: hasMetaIntegration(),
      icon: Share2,
      premium: false
    },
    {
      key: 'advanced_analytics',
      name: 'Advanced Analytics',
      description: 'Detailed reporting and insights',
      enabled: hasAdvancedAnalytics(),
      icon: BarChart3,
      premium: false
    },
    {
      key: 'elevenlabs_access',
      name: 'Voice AI',
      description: 'Voice synthesis and speech-to-text',
      enabled: hasElevenLabsAccess(),
      icon: Phone,
      premium: true
    }
  ];

  const enabledFeatures = featureItems.filter(f => f.enabled);
  const premiumFeatures = enabledFeatures.filter(f => f.premium);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Feature Access Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{enabledFeatures.length}</div>
              <p className="text-sm text-muted-foreground">Total Features</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{premiumFeatures.length}</div>
              <p className="text-sm text-muted-foreground">Premium Features</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {enabledFeatures.length > 0 ? '✓' : '✗'}
              </div>
              <p className="text-sm text-muted-foreground">Status</p>
            </div>
          </div>

          {enabledFeatures.length === 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Your organization has basic access only. Contact your administrator to enable additional features.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {featureItems.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.key}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    feature.enabled ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${feature.enabled ? 'text-green-600' : 'text-gray-400'}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{feature.name}</span>
                        {feature.premium && (
                          <Badge variant="outline" className="text-xs">
                            Premium
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                      {feature.details && feature.enabled && (
                        <p className="text-xs text-primary mt-1">{feature.details}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    {feature.enabled ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};