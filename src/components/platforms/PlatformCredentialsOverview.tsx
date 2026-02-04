import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  ExternalLink,
  Lock,
  Key
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PlatformCredentialStatus {
  platform: string;
  displayName: string;
  logo?: string;
  hasAllSecrets: boolean;
  configuredSecrets: string[];
  missingSecrets: string[];
  category: 'paid' | 'free' | 'trucking';
  docsUrl?: string;
}

const PLATFORM_CREDENTIAL_MAP: Record<string, { 
  displayName: string; 
  logo?: string; 
  category: 'paid' | 'free' | 'trucking';
  docsUrl?: string;
}> = {
  x: { 
    displayName: 'X (Twitter)', 
    logo: '/lovable-uploads/4eb0ffa4-7d5c-437d-bf75-d16a985e6189.png',
    category: 'paid',
    docsUrl: 'https://developer.twitter.com/en/docs'
  },
  twitter: { 
    displayName: 'X (Twitter)', 
    logo: '/lovable-uploads/4eb0ffa4-7d5c-437d-bf75-d16a985e6189.png',
    category: 'paid',
    docsUrl: 'https://developer.twitter.com/en/docs'
  },
  facebook: { 
    displayName: 'Meta (Facebook/Instagram)', 
    logo: '/lovable-uploads/9d2222a9-c812-4222-ba8e-20535dc278b6.png',
    category: 'paid',
    docsUrl: 'https://developers.facebook.com/docs/marketing-apis/'
  },
  instagram: { 
    displayName: 'Meta (Facebook/Instagram)', 
    logo: '/lovable-uploads/9d2222a9-c812-4222-ba8e-20535dc278b6.png',
    category: 'paid',
    docsUrl: 'https://developers.facebook.com/docs/marketing-apis/'
  },
  linkedin: { 
    displayName: 'LinkedIn', 
    logo: '/logos/linkedin-logo.png',
    category: 'paid',
    docsUrl: 'https://learn.microsoft.com/en-us/linkedin/marketing/'
  },
  tiktok: { 
    displayName: 'TikTok', 
    logo: '/logos/tiktok-logo.png',
    category: 'paid',
    docsUrl: 'https://business-api.tiktok.com/portal/docs'
  },
  reddit: { 
    displayName: 'Reddit', 
    logo: '/logos/reddit-logo.png',
    category: 'paid',
    docsUrl: 'https://www.reddit.com/dev/api/'
  },
};

const PlatformCredentialsOverview: React.FC = () => {
  const [credentials, setCredentials] = useState<PlatformCredentialStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCredentialStatus = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const platformsToCheck = ['x', 'facebook', 'linkedin', 'tiktok', 'reddit'];
      
      const { data, error: fnError } = await supabase.functions.invoke('verify-platform-secrets', {
        body: { platforms: platformsToCheck }
      });

      if (fnError) throw fnError;

      if (data?.results) {
        const statusList: PlatformCredentialStatus[] = Object.entries(data.results).map(([platform, status]: [string, any]) => {
          const config = PLATFORM_CREDENTIAL_MAP[platform] || {
            displayName: platform.charAt(0).toUpperCase() + platform.slice(1),
            category: 'paid' as const
          };
          
          return {
            platform,
            displayName: config.displayName,
            logo: config.logo,
            hasAllSecrets: status.hasAllSecrets,
            configuredSecrets: status.configuredSecrets || [],
            missingSecrets: status.missingSecrets || [],
            category: config.category,
            docsUrl: config.docsUrl,
          };
        });
        
        // Deduplicate (x and twitter are same)
        const uniqueStatuses = statusList.filter((s, i, arr) => 
          arr.findIndex(t => t.displayName === s.displayName) === i
        );
        
        setCredentials(uniqueStatuses);
      }
    } catch (err) {
      console.error('Failed to fetch credential status:', err);
      setError('Failed to verify platform credentials');
      toast({
        title: "Error",
        description: "Could not verify platform credentials",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentialStatus();
  }, []);

  const connectedCount = credentials.filter(c => c.hasAllSecrets).length;
  const totalCount = credentials.length;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Key className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Platform Credentials</CardTitle>
              <CardDescription>
                API credential status for ad network integrations
              </CardDescription>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchCredentialStatus}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="font-medium">{connectedCount} Connected</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">{totalCount - connectedCount} Not Configured</span>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Platform List */}
        <div className="space-y-3">
          {credentials.map((cred) => (
            <div 
              key={cred.platform}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                {cred.logo ? (
                  <img 
                    src={cred.logo} 
                    alt={cred.displayName}
                    className="w-8 h-8 rounded object-contain"
                  />
                ) : (
                  <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{cred.displayName}</p>
                  <p className="text-xs text-muted-foreground">
                    {cred.hasAllSecrets 
                      ? `${cred.configuredSecrets.length} secrets configured`
                      : `Missing: ${cred.missingSecrets.join(', ')}`
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge 
                  variant={cred.hasAllSecrets ? 'default' : 'secondary'}
                  className={cred.hasAllSecrets ? 'bg-green-600' : ''}
                >
                  {cred.hasAllSecrets ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Connected
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Not Configured
                    </>
                  )}
                </Badge>
                
                {cred.docsUrl && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => window.open(cred.docsUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Help Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-1">Need to configure credentials?</p>
            <p className="text-sm">
              API credentials are stored securely as environment secrets. Contact your administrator 
              or use the Lovable secrets manager to add missing credentials.
            </p>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default PlatformCredentialsOverview;
