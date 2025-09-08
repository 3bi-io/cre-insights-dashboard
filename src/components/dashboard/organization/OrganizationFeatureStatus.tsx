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
            <div className="text-center p-4 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
              <div className="text-3xl font-bold text-primary mb-1">{enabledFeatures.length}</div>
              <p className="text-sm font-medium text-primary/80">Total Features</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-gradient-to-br from-warning/10 to-warning/5 border border-warning/20">
              <div className="text-3xl font-bold text-warning mb-1 flex items-center justify-center gap-1">
                <Crown className="w-6 h-6" />
                {premiumFeatures.length}
              </div>
              <p className="text-sm font-medium text-warning/80">Premium Features</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-gradient-to-br from-success/10 to-success/5 border border-success/20">
              <div className={`text-3xl font-bold mb-1 ${
                enabledFeatures.length > 0 ? 'text-success' : 'text-muted-foreground'
              }`}>
                {enabledFeatures.length > 0 ? (
                  <CheckCircle className="w-8 h-8 mx-auto" />
                ) : (
                  <XCircle className="w-8 h-8 mx-auto" />
                )}
              </div>
              <p className={`text-sm font-medium ${
                enabledFeatures.length > 0 ? 'text-success/80' : 'text-muted-foreground/80'
              }`}>
                {enabledFeatures.length > 0 ? 'Active' : 'Inactive'}
              </p>
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
                  className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-300 ${
                    feature.enabled 
                      ? feature.premium 
                        ? 'border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 shadow-primary/10 shadow-lg' 
                        : 'border-success/20 bg-success-light shadow-success/10 shadow-md'
                      : 'border-border bg-muted/30 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${
                      feature.enabled 
                        ? feature.premium 
                          ? 'bg-gradient-primary text-primary-foreground shadow-primary/30 shadow-md' 
                          : 'bg-success text-success-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${feature.enabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {feature.name}
                        </span>
                        {feature.premium && (
                          <Badge 
                            variant={feature.enabled ? "default" : "outline"} 
                            className={`text-xs ${
                              feature.enabled 
                                ? 'bg-gradient-primary text-primary-foreground border-0' 
                                : 'border-warning/20 text-warning'
                            }`}
                          >
                            {feature.enabled && <Crown className="w-3 h-3 mr-1" />}
                            Premium
                          </Badge>
                        )}
                      </div>
                      <p className={`text-sm mt-1 ${
                        feature.enabled ? 'text-muted-foreground' : 'text-muted-foreground/70'
                      }`}>
                        {feature.description}
                      </p>
                      {feature.details && feature.enabled && (
                        <p className="text-xs text-primary font-medium mt-1 bg-primary/10 px-2 py-1 rounded-md inline-block">
                          {feature.details}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    {feature.enabled ? (
                      <div className="flex flex-col items-center gap-1">
                        <CheckCircle className={`w-6 h-6 ${
                          feature.premium ? 'text-primary' : 'text-success'
                        }`} />
                        <span className={`text-xs font-medium ${
                          feature.premium ? 'text-primary' : 'text-success'
                        }`}>
                          Active
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <XCircle className="w-6 h-6 text-muted-foreground/50" />
                        <span className="text-xs text-muted-foreground/70">
                          Disabled
                        </span>
                      </div>
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