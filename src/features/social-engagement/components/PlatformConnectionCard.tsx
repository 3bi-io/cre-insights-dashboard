import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Facebook, 
  Instagram, 
  MessageCircle, 
  Linkedin,
  Bot,
  Link2,
  Link2Off,
  Settings,
  Trash2,
  Loader2,
} from 'lucide-react';
import { SocialConnection, SocialPlatform, useSocialConnections } from '../hooks/useSocialConnections';
import { useSocialOAuth } from '../hooks/useSocialOAuth';
import { SocialOAuthDialog } from './SocialOAuthDialog';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// X (Twitter) icon component
const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const PLATFORM_CONFIG: Record<SocialPlatform, {
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}> = {
  facebook: {
    name: 'Facebook',
    icon: <Facebook className="h-5 w-5" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  instagram: {
    name: 'Instagram',
    icon: <Instagram className="h-5 w-5" />,
    color: 'text-pink-600',
    bgColor: 'bg-gradient-to-r from-purple-100 to-pink-100',
  },
  twitter: {
    name: 'X (Twitter)',
    icon: <XIcon className="h-5 w-5" />,
    color: 'text-foreground',
    bgColor: 'bg-muted',
  },
  whatsapp: {
    name: 'WhatsApp',
    icon: <MessageCircle className="h-5 w-5" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  linkedin: {
    name: 'LinkedIn',
    icon: <Linkedin className="h-5 w-5" />,
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
  },
};

interface PlatformConnectionCardProps {
  connection?: SocialConnection;
  platform?: SocialPlatform;
  compact?: boolean;
  organizationId?: string;
}

export function PlatformConnectionCard({ 
  connection, 
  platform: platformProp,
  compact = false,
  organizationId,
}: PlatformConnectionCardProps) {
  const { toggleAutoRespond, toggleActive } = useSocialConnections();
  const { initiateOAuth, disconnectPlatform, isConnecting, error, resetError } = useSocialOAuth({ organizationId });
  
  const [showOAuthDialog, setShowOAuthDialog] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  
  const platform = connection?.platform || platformProp;
  if (!platform) return null;
  
  const config = PLATFORM_CONFIG[platform];
  const isConnected = !!connection;
  const isActive = connection?.is_active ?? false;
  const autoRespondEnabled = connection?.auto_respond_enabled ?? false;

  const handleConnectClick = () => {
    setShowOAuthDialog(true);
  };

  const handleConnect = async (platform: SocialPlatform) => {
    await initiateOAuth(platform);
  };

  const handleDisconnect = async () => {
    if (!connection) return;
    setIsDisconnecting(true);
    await disconnectPlatform(connection.id);
    setIsDisconnecting(false);
    setShowDisconnectDialog(false);
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", config.bgColor, config.color)}>
            {config.icon}
          </div>
          <div>
            <p className="font-medium text-sm">{config.name}</p>
            {connection?.page_name && (
              <p className="text-xs text-muted-foreground">{connection.page_name}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Badge variant={isActive ? 'default' : 'secondary'}>
                {isActive ? 'Active' : 'Paused'}
              </Badge>
              {autoRespondEnabled && (
                <Badge variant="outline" className="gap-1">
                  <Bot className="h-3 w-3" />
                  Auto
                </Badge>
              )}
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={handleConnectClick}>
              Connect
            </Button>
          )}
        </div>
        
        <SocialOAuthDialog
          open={showOAuthDialog}
          onOpenChange={(open) => {
            setShowOAuthDialog(open);
            if (!open) resetError();
          }}
          platform={platform}
          onConnect={handleConnect}
          isConnecting={isConnecting}
          error={error}
        />
      </div>
    );
  }

  return (
    <>
      <Card className={cn(!isConnected && "opacity-75")}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("p-3 rounded-lg", config.bgColor, config.color)}>
                {config.icon}
              </div>
              <div>
                <CardTitle className="text-lg">{config.name}</CardTitle>
                {connection?.page_name && (
                  <p className="text-sm text-muted-foreground">{connection.page_name}</p>
                )}
                {connection?.platform_username && !connection?.page_name && (
                  <p className="text-sm text-muted-foreground">{connection.platform_username}</p>
                )}
              </div>
            </div>
            
            {isConnected ? (
              <Badge variant={isActive ? 'default' : 'secondary'} className="gap-1">
                <Link2 className="h-3 w-3" />
                {isActive ? 'Connected' : 'Paused'}
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <Link2Off className="h-3 w-3" />
                Not connected
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {isConnected ? (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">
                    Receive and process messages
                  </p>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={(checked) => {
                    toggleActive.mutate({ connectionId: connection.id, active: checked });
                  }}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    Auto-Respond
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Let AI respond to common inquiries
                  </p>
                </div>
                <Switch
                  checked={autoRespondEnabled}
                  onCheckedChange={(checked) => {
                    toggleAutoRespond.mutate({ connectionId: connection.id, enabled: checked });
                  }}
                  disabled={!isActive}
                />
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-2">
                  <Settings className="h-4 w-4" />
                  Configure
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 text-destructive hover:text-destructive"
                  onClick={() => setShowDisconnectDialog(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <Button className="w-full gap-2" onClick={handleConnectClick}>
              <Link2 className="h-4 w-4" />
              Connect {config.name}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* OAuth Dialog */}
      <SocialOAuthDialog
        open={showOAuthDialog}
        onOpenChange={(open) => {
          setShowOAuthDialog(open);
          if (!open) resetError();
        }}
        platform={platform}
        onConnect={handleConnect}
        isConnecting={isConnecting}
        error={error}
      />

      {/* Disconnect Confirmation Dialog */}
      <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {config.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the connection to {connection?.page_name || config.name}. 
              You'll stop receiving messages and won't be able to respond until you reconnect.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDisconnecting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDisconnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                'Disconnect'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
