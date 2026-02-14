import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, AlertCircle, ExternalLink } from 'lucide-react';
import { PlatformCredentialCard } from './PlatformCredentialCard';
import { useSocialBeaconConfig } from '../../hooks/useSocialBeaconConfig';
import { SOCIAL_BEACONS, getAllSocialBeacons } from '../../config/socialBeacons.config';
import { supabase } from '@/integrations/supabase/client';

interface PlatformCredentialsManagerProps {
  organizationId?: string | null;
}

interface SecretVerificationResult {
  hasAllSecrets: boolean;
  configuredSecrets: string[];
  missingSecrets: string[];
}

export function PlatformCredentialsManager({ organizationId = null }: PlatformCredentialsManagerProps) {
  const { toast } = useToast();
  const [testingPlatform, setTestingPlatform] = useState<string | null>(null);
  const [verifiedSecrets, setVerifiedSecrets] = useState<Record<string, SecretVerificationResult>>({});
  const [isVerifying, setIsVerifying] = useState(false);
  
  const {
    configs,
    isLoading,
    error,
    getConfigByPlatform,
    toggleFeature,
  } = useSocialBeaconConfig(organizationId);

  const allPlatforms = getAllSocialBeacons();
  
  // Sort platforms: connected first, then partial, then not configured
  const platforms = [...allPlatforms].sort((a, b) => {
    const aVerification = verifiedSecrets[a.platform];
    const bVerification = verifiedSecrets[b.platform];
    const aConfig = getConfigByPlatform(a.platform);
    const bConfig = getConfigByPlatform(b.platform);
    
    // Calculate priority: 3 = fully connected, 2 = partial, 1 = has config, 0 = not configured
    const getPriority = (verification: typeof aVerification, config: typeof aConfig) => {
      if (verification?.hasAllSecrets) return 3;
      if (verification?.configuredSecrets?.length > 0) return 2;
      if (config) return 1;
      return 0;
    };
    
    return getPriority(bVerification, bConfig) - getPriority(aVerification, aConfig);
  });

  // Verify secrets on mount and when refresh is clicked
  const verifyAllSecrets = async () => {
    setIsVerifying(true);
    try {
      const platformNames = platforms.map(p => p.platform);
      const { data, error } = await supabase.functions.invoke('verify-platform-secrets', {
        body: { platforms: platformNames }
      });

      if (error) {
        console.error('Failed to verify secrets:', error);
        toast({
          title: 'Verification failed',
          description: 'Could not verify platform secrets. Check edge function logs.',
          variant: 'destructive',
        });
        return;
      }

      if (data?.success && data.results) {
        setVerifiedSecrets(data.results);
      }
    } catch (err) {
      console.error('Secret verification error:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    verifyAllSecrets();
  }, []);

  // Get configured secrets from verification results
  const getConfiguredSecrets = (platform: string): string[] => {
    const verification = verifiedSecrets[platform];
    if (verification?.configuredSecrets) {
      return verification.configuredSecrets;
    }
    return [];
  };

  const handleConfigure = (platform: string) => {
    const beacon = SOCIAL_BEACONS[platform as keyof typeof SOCIAL_BEACONS];
    const requiredSecrets = beacon?.requiredSecrets || [];
    const verification = verifiedSecrets[platform];
    
    // Show detailed status
    const configured = verification?.configuredSecrets || [];
    const missing = verification?.missingSecrets || requiredSecrets;
    
    if (missing.length > 0) {
      toast({
        title: `Configure ${beacon?.name}`,
        description: (
          <div className="space-y-2">
            <p>Missing secrets: {missing.join(', ')}</p>
            <p className="text-xs">Add these in Supabase Dashboard → Edge Functions → Secrets</p>
          </div>
        ) as any,
      });
    } else {
      toast({
        title: `${beacon?.name} Configured`,
        description: 'All required secrets are set. You can now enable features.',
      });
    }
  };

  const handleTest = async (platform: string) => {
    setTestingPlatform(platform);
    const beacon = SOCIAL_BEACONS[platform as keyof typeof SOCIAL_BEACONS];
    
    try {
      // First verify secrets are configured
      const { data, error } = await supabase.functions.invoke('verify-platform-secrets', {
        body: { platform }
      });

      if (error) {
        toast({
          title: 'Test Failed',
          description: `Could not verify ${beacon?.name} configuration: ${error.message}`,
          variant: 'destructive',
        });
        return;
      }

      if (!data?.hasAllSecrets) {
        toast({
          title: 'Configuration Incomplete',
          description: `Missing secrets: ${data?.missingSecrets?.join(', ')}`,
          variant: 'destructive',
        });
        return;
      }

      // Update local state with verification result
      setVerifiedSecrets(prev => ({
        ...prev,
        [platform]: {
          hasAllSecrets: data.hasAllSecrets,
          configuredSecrets: data.configuredSecrets,
          missingSecrets: data.missingSecrets,
        }
      }));

      toast({
        title: 'Secrets Verified',
        description: `${beacon?.name} API credentials are configured. Use OAuth to complete connection.`,
      });
    } catch (err) {
      console.error('Test failed:', err);
      toast({
        title: 'Test Error',
        description: err instanceof Error ? err.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setTestingPlatform(null);
    }
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

  const handleRefresh = () => {
    verifyAllSecrets();
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
          disabled={isLoading || isVerifying}
          onClick={handleRefresh}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading || isVerifying ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
            isLoading={testingPlatform === platform.platform || toggleFeature.isPending || isVerifying}
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
            <li>Click "Refresh" above to verify secrets are configured</li>
            <li>Enable the platform features</li>
          </ol>
          <Button variant="link" className="px-0 h-auto text-primary" asChild>
            <a 
              href="https://supabase.com/dashboard/project/auwhcdpppldjlcaxzsme/settings/functions" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Open Supabase Edge Function Secrets →
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
