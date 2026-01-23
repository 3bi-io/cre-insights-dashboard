import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Facebook, 
  Instagram, 
  MessageCircle, 
  Linkedin,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Shield,
} from 'lucide-react';
import { SocialPlatform } from '../hooks/useSocialConnections';
import { cn } from '@/lib/utils';

// X (Twitter) icon component
const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

interface PlatformInfo {
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  description: string;
  permissions: string[];
  supported: boolean;
}

const PLATFORM_INFO: Record<SocialPlatform, PlatformInfo> = {
  facebook: {
    name: 'Facebook',
    icon: <Facebook className="h-6 w-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'Connect your Facebook Pages to manage comments, messages, and posts.',
    permissions: [
      'Read and respond to page messages',
      'View and reply to comments',
      'Access page insights',
      'Manage page posts',
    ],
    supported: true,
  },
  instagram: {
    name: 'Instagram',
    icon: <Instagram className="h-6 w-6" />,
    color: 'text-pink-600',
    bgColor: 'bg-gradient-to-r from-purple-100 to-pink-100',
    description: 'Connect your Instagram Business account for comments and DMs.',
    permissions: [
      'Read and respond to direct messages',
      'View and reply to comments',
      'Access account insights',
    ],
    supported: true,
  },
  twitter: {
    name: 'X (Twitter)',
    icon: <XIcon className="h-6 w-6" />,
    color: 'text-black dark:text-white',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    description: 'Connect your X account for mentions and direct messages.',
    permissions: [
      'Read tweets and mentions',
      'Send tweets and replies',
      'Read and send direct messages',
    ],
    supported: false, // Requires Twitter API access
  },
  whatsapp: {
    name: 'WhatsApp Business',
    icon: <MessageCircle className="h-6 w-6" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    description: 'Connect your WhatsApp Business account for customer messaging.',
    permissions: [
      'Send and receive messages',
      'Access message templates',
      'View conversation history',
    ],
    supported: true, // Via Meta Business Suite
  },
  linkedin: {
    name: 'LinkedIn',
    icon: <Linkedin className="h-6 w-6" />,
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    description: 'Connect your LinkedIn Company Page for professional engagement.',
    permissions: [
      'Post updates to company page',
      'View and respond to comments',
      'Access page analytics',
    ],
    supported: false, // Requires LinkedIn Partner approval
  },
};

interface SocialOAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: SocialPlatform | null;
  onConnect: (platform: SocialPlatform) => Promise<void>;
  isConnecting: boolean;
  error?: string | null;
}

export function SocialOAuthDialog({
  open,
  onOpenChange,
  platform,
  onConnect,
  isConnecting,
  error,
}: SocialOAuthDialogProps) {
  if (!platform) return null;

  const info = PLATFORM_INFO[platform];

  const handleConnect = async () => {
    await onConnect(platform);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={cn("p-3 rounded-lg", info.bgColor, info.color)}>
              {info.icon}
            </div>
            <div>
              <DialogTitle>Connect {info.name}</DialogTitle>
              <DialogDescription className="mt-1">
                {info.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Permissions List */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Shield className="h-4 w-4 text-muted-foreground" />
              Permissions requested
            </div>
            <ul className="space-y-2">
              {info.permissions.map((permission, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  {permission}
                </li>
              ))}
            </ul>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Not Supported Warning */}
          {!info.supported && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {platform === 'twitter' && 'X (Twitter) API access requires an approved developer account. Contact support to enable this integration.'}
                {platform === 'linkedin' && 'LinkedIn API integration requires partner approval. Contact support to enable this integration.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Connect Button */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isConnecting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleConnect}
              disabled={isConnecting || !info.supported}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4" />
                  Connect with {info.name}
                </>
              )}
            </Button>
          </div>

          {/* Security Note */}
          <p className="text-xs text-center text-muted-foreground">
            You'll be redirected to {info.name} to authorize access. 
            We never store your password.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
