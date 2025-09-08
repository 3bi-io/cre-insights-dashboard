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
  meta_integration?: boolean;
  voice_agent?: boolean;
  advanced_analytics?: boolean;
  elevenlabs_access?: boolean;
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
          <CardTitle>Feature Not Available</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            This feature is not available in your current plan.
          </p>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
};

export default FeatureGuard;