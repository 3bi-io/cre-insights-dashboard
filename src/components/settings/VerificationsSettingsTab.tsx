import React from 'react';
import { Card } from '@/components/ui/card';
import { Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { FeatureGuard } from '@/components/FeatureGuard';
import { BGCProviderConnections } from '@/features/screening';

const VerificationsSettingsTab = () => {
  const { organization } = useAuth();

  return (
    <FeatureGuard 
      feature="background_check_access" 
      featureName="Background Check Integration"
      showUpgrade={true}
    >
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold">Background Check Providers</h2>
        </div>
        <p className="text-muted-foreground mb-6">
          Connect to background check providers like Checkr, Sterling, HireRight, 
          GoodHire, and Accurate Background for direct API integrations
        </p>
        {organization?.id ? (
          <BGCProviderConnections organizationId={organization.id} />
        ) : (
          <Card className="p-6 text-center">
            <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              Organization required to manage background check providers
            </p>
          </Card>
        )}
      </div>
    </FeatureGuard>
  );
};

export default VerificationsSettingsTab;
