import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ExternalLink, Copy, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAllSocialBeacons, type SocialBeaconPlatform } from '../../config/socialBeacons.config';

interface OAuthConfigPanelProps {
  organizationId?: string | null;
}

export function OAuthConfigPanel({ organizationId = null }: OAuthConfigPanelProps) {
  const { toast } = useToast();
  
  // Get the base URL for OAuth callbacks
  const callbackBaseUrl = `https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/social-oauth-callback`;

  const platforms = getAllSocialBeacons().filter(p => 
    p.authType === 'oauth2' || p.authType === 'oauth2_pkce'
  );

  const handleCopyCallback = (platform: string) => {
    const callbackUrl = `${callbackBaseUrl}?platform=${platform}`;
    navigator.clipboard.writeText(callbackUrl);
    toast({
      title: 'Copied!',
      description: 'OAuth callback URL copied to clipboard.',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">OAuth Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Configure OAuth redirect URIs and callback URLs for social platform authentication
        </p>
      </div>

      <Card className="bg-muted/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Callback URL Base</CardTitle>
          <CardDescription>
            Use this base URL when configuring OAuth apps in each platform's developer console
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input
              value={callbackBaseUrl}
              readOnly
              className="font-mono text-sm bg-background"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                navigator.clipboard.writeText(callbackBaseUrl);
                toast({ title: 'Copied!' });
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {platforms.map((platform) => {
          const PlatformIcon = platform.icon;
          const callbackUrl = `${callbackBaseUrl}?platform=${platform.platform}`;

          return (
            <Card key={platform.platform}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="h-8 w-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: platform.bgColor }}
                  >
                    <PlatformIcon 
                      className="h-4 w-4" 
                      style={{ color: platform.color }}
                    />
                  </div>
                  <div>
                    <CardTitle className="text-sm">{platform.name}</CardTitle>
                    <Badge variant="outline" className="text-xs mt-1">
                      {platform.authType === 'oauth2_pkce' ? 'OAuth 2.0 + PKCE' : 'OAuth 2.0'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Redirect URI</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={callbackUrl}
                      readOnly
                      className="font-mono text-xs bg-muted"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => handleCopyCallback(platform.platform)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Required Scopes</Label>
                  <div className="flex flex-wrap gap-1">
                    {getOAuthScopes(platform.platform).map((scope) => (
                      <Badge key={scope} variant="secondary" className="text-xs font-mono">
                        {scope}
                      </Badge>
                    ))}
                  </div>
                </div>

                {platform.apiDocUrl && (
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={platform.apiDocUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-2" />
                      Developer Docs
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// Helper function to get OAuth scopes for each platform
function getOAuthScopes(platform: SocialBeaconPlatform): string[] {
  const scopes: Record<SocialBeaconPlatform, string[]> = {
    x: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
    facebook: ['pages_manage_posts', 'pages_read_engagement', 'pages_messaging'],
    instagram: ['instagram_basic', 'instagram_content_publish', 'pages_read_engagement'],
    whatsapp: [], // WhatsApp uses Business API, not OAuth
    tiktok: ['user.info.basic', 'video.list', 'video.publish'],
    reddit: ['identity', 'submit', 'read'],
    linkedin: ['r_liteprofile', 'r_organization_social', 'w_organization_social', 'rw_organization_admin'],
  };
  return scopes[platform] || [];
}
