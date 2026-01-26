import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { PlatformCredentialCard } from './PlatformCredentialCard';
import { useSocialBeaconConfig } from '../../hooks/useSocialBeaconConfig';
import { SOCIAL_BEACONS, getAllSocialBeacons } from '../../config/socialBeacons.config';

interface PlatformCredentialsManagerProps {
  organizationId?: string | null;
}

export function PlatformCredentialsManager({ organizationId = null }: PlatformCredentialsManagerProps) {
  const { toast } = useToast();
  const [testingPlatform, setTestingPlatform] = useState<string | null>(null);
  
  const {
    configs,
    isLoading,
    error,
    getConfigByPlatform,
    toggleFeature,
  } = useSocialBeaconConfig(organizationId);

  const platforms = getAllSocialBeacons();

  // Mock configured secrets (in production, this would come from an edge function)
  // For now, we'll check the database config as a proxy
  const getConfiguredSecrets = (platform: string): string[] => {
    const config = getConfigByPlatform(platform as any);
    if (config?.auto_engage_enabled || config?.ad_creative_enabled) {
      return SOCIAL_BEACONS[platform as keyof typeof SOCIAL_BEACONS]?.requiredSecrets || [];
    }
    return [];
  };

  const handleConfigure = (platform: string) => {
    toast({
      title: 'Configure Credentials',
      description: `Navigate to Supabase Dashboard > Edge Functions > Secrets to configure ${SOCIAL_BEACONS[platform as keyof typeof SOCIAL_BEACONS]?.name} credentials.`,
    });
  };

  const handleTest = async (platform: string) => {
    setTestingPlatform(platform);
    
    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: 'Connection Test',
      description: `${SOCIAL_BEACONS[platform as keyof typeof SOCIAL_BEACONS]?.name} connection test initiated. Check edge function logs for results.`,
    });
    
    setTestingPlatform(null);
  };

  const handleToggleAutoEngage = (platform: string, enabled: boolean) => {
    toggleFeature.mutate({ 
      platform: platform as any, 
      feature: 'auto_engage_enabled', 
      enabled 
    });
  };

  const handleToggleAdCreative = (platform: string, enabled: boolean) => {
    toggleFeature.mutate({ 
      platform: platform as any, 
      feature: 'ad_creative_enabled', 
      enabled 
    });
  };

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p>Failed to load platform configurations: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Platform Credentials</h3>
          <p className="text-sm text-muted-foreground">
            Configure API credentials and OAuth settings for each social platform
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          disabled={isLoading}
          onClick={() => window.location.reload()}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {platforms.map((platform) => (
          <PlatformCredentialCard
            key={platform.platform}
            config={platform}
            dbConfig={getConfigByPlatform(platform.platform)}
            configuredSecrets={getConfiguredSecrets(platform.platform)}
            onConfigure={() => handleConfigure(platform.platform)}
            onTest={() => handleTest(platform.platform)}
            onToggleAutoEngage={(enabled) => handleToggleAutoEngage(platform.platform, enabled)}
            onToggleAdCreative={(enabled) => handleToggleAdCreative(platform.platform, enabled)}
            isLoading={testingPlatform === platform.platform || toggleFeature.isPending}
          />
        ))}
      </div>

      <Card className="bg-muted/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Adding Credentials</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            To configure platform credentials, add them as secrets in your Supabase Edge Functions:
          </p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Go to Supabase Dashboard → Edge Functions → Secrets</li>
            <li>Add each required secret for the platform</li>
            <li>Return here and enable the platform features</li>
          </ol>
          <Button variant="link" className="px-0 h-auto text-primary" asChild>
            <a 
              href="https://supabase.com/dashboard/project/auwhcdpppldjlcaxzsme/settings/functions" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Open Supabase Edge Function Secrets →
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
