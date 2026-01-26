import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ExternalLink,
  Webhook,
  MessageSquare,
  Image
} from 'lucide-react';
import type { SocialBeaconConfig } from '../../config/socialBeacons.config';
import type { SocialBeaconConfigRecord } from '../../types/adCreative.types';

interface PlatformCredentialCardProps {
  config: SocialBeaconConfig;
  dbConfig?: SocialBeaconConfigRecord;
  configuredSecrets?: string[];
  onConfigure: () => void;
  onTest: () => void;
  onToggleAutoEngage?: (enabled: boolean) => void;
  onToggleAdCreative?: (enabled: boolean) => void;
  isLoading?: boolean;
}

export function PlatformCredentialCard({
  config,
  dbConfig,
  configuredSecrets = [],
  onConfigure,
  onTest,
  onToggleAutoEngage,
  onToggleAdCreative,
  isLoading = false,
}: PlatformCredentialCardProps) {
  const PlatformIcon = config.icon;
  
  // Calculate secrets status
  const configuredCount = config.requiredSecrets.filter(s => 
    configuredSecrets.includes(s)
  ).length;
  const totalRequired = config.requiredSecrets.length;
  const allConfigured = configuredCount === totalRequired;
  const partiallyConfigured = configuredCount > 0 && configuredCount < totalRequired;

  // Determine connection status
  const getStatusBadge = () => {
    if (allConfigured) {
      return (
        <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Connected
        </Badge>
      );
    }
    if (partiallyConfigured) {
      return (
        <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20">
          <AlertCircle className="h-3 w-3 mr-1" />
          Partial
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="text-muted-foreground">
        <XCircle className="h-3 w-3 mr-1" />
        Not Configured
      </Badge>
    );
  };

  // Get auth type display
  const getAuthTypeLabel = () => {
    switch (config.authType) {
      case 'oauth2':
        return 'OAuth 2.0';
      case 'oauth2_pkce':
        return 'OAuth 2.0 + PKCE';
      case 'api_key':
        return 'API Key';
      case 'business_api':
        return 'Business API';
      default:
        return config.authType;
    }
  };

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-md',
      allConfigured && 'border-green-500/30',
      partiallyConfigured && 'border-amber-500/30'
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="h-10 w-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: config.bgColor }}
            >
              <PlatformIcon 
                className="h-5 w-5" 
                style={{ color: config.color }}
              />
            </div>
            <div>
              <CardTitle className="text-base">{config.name}</CardTitle>
              <CardDescription className="text-xs">
                {getAuthTypeLabel()}
              </CardDescription>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        <p className="text-sm text-muted-foreground">
          {config.description}
        </p>

        {/* Secrets Status */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Required Credentials ({configuredCount}/{totalRequired})
          </p>
          <div className="flex flex-wrap gap-1">
            {config.requiredSecrets.map((secret) => {
              const isConfigured = configuredSecrets.includes(secret);
              return (
                <Badge 
                  key={secret}
                  variant="outline"
                  className={cn(
                    'text-xs',
                    isConfigured 
                      ? 'border-green-500/30 text-green-600' 
                      : 'border-destructive/30 text-destructive'
                  )}
                >
                  {isConfigured ? '✓' : '✗'} {secret.split('_').slice(-1)[0]}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="space-y-3 pt-2 border-t border-border">
          {config.webhookSupported && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Webhook className="h-4 w-4 text-muted-foreground" />
                <span>Webhooks</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {dbConfig?.webhook_verified_at ? 'Verified' : 'Available'}
              </Badge>
            </div>
          )}
          
          {config.autoEngageSupported && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span>Auto-Engage</span>
              </div>
              <Switch
                checked={dbConfig?.auto_engage_enabled || false}
                onCheckedChange={onToggleAutoEngage}
                disabled={!allConfigured || isLoading}
              />
            </div>
          )}
          
          {config.adCreativeSupported && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Image className="h-4 w-4 text-muted-foreground" />
                <span>Ad Creative</span>
              </div>
              <Switch
                checked={dbConfig?.ad_creative_enabled || false}
                onCheckedChange={onToggleAdCreative}
                disabled={!allConfigured || isLoading}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={onConfigure}
          >
            <Settings className="h-4 w-4 mr-1" />
            Configure
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onTest}
            disabled={!allConfigured}
          >
            Test
          </Button>
          {config.apiDocUrl && (
            <Button
              variant="ghost"
              size="sm"
              asChild
            >
              <a href={config.apiDocUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
