/**
 * FeatureGuard Component
 * Guards features based on organization feature flags
 * Note: All features are now available to all users - this guards specific integrations
 */

import React from 'react';
import { useOrganizationFeatures } from '@/hooks/useOrganizationFeatures';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock } from 'lucide-react';

interface FeatureGuardProps {
  children: React.ReactNode;
  feature: keyof OrganizationFeatures;
  fallback?: React.ReactNode;
}

interface OrganizationFeatures {
  tenstreet_access?: boolean;
  openai_access?: boolean;
  anthropic_access?: boolean;
  grok_access?: boolean;
  meta_integration?: boolean;
  voice_agent?: boolean;
  advanced_analytics?: boolean;
  elevenlabs_access?: boolean;
  social_beacon?: boolean;
}

const FeatureGuard: React.FC<FeatureGuardProps> = ({ 
  children, 
  feature, 
  fallback 
}) => {
  const { hasFeature, isLoading } = useOrganizationFeatures();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasFeature(feature)) {
    return fallback || (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-muted-foreground" />
          </div>
          <CardTitle>Feature Not Enabled</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            This integration needs to be enabled for your organization. Contact your administrator.
          </p>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
};

export default FeatureGuard;
