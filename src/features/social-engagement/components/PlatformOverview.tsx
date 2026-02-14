import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  Facebook, 
  Instagram, 
  Linkedin, 
  MessageCircle,
  MessageSquare,
  Video,
  Settings,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
} from 'lucide-react';
import { SocialConnection, SocialPlatform, useSocialConnections } from '../hooks/useSocialConnections';
import { cn } from '@/lib/utils';

interface PlatformOverviewProps {
  organizationId?: string;
}

// X (Twitter) icon component
const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const PLATFORM_CONFIG: Record<SocialPlatform, {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  description: string;
}> = {
  facebook: { name: 'Facebook', icon: Facebook, color: 'text-blue-600', bgColor: 'bg-blue-500/10', description: 'Pages, comments, and Messenger' },
  instagram: { name: 'Instagram', icon: Instagram, color: 'text-pink-600', bgColor: 'bg-pink-500/10', description: 'Comments and direct messages' },
  x: { name: 'X (Twitter)', icon: XIcon, color: 'text-foreground', bgColor: 'bg-foreground/10', description: 'Mentions and direct messages' },
  whatsapp: { name: 'WhatsApp', icon: MessageCircle, color: 'text-green-600', bgColor: 'bg-green-500/10', description: 'Business messaging' },
  linkedin: { name: 'LinkedIn', icon: Linkedin, color: 'text-blue-700', bgColor: 'bg-blue-700/10', description: 'Company page interactions' },
  tiktok: { name: 'TikTok', icon: Video, color: 'text-foreground', bgColor: 'bg-foreground/10', description: 'Video content engagement' },
  reddit: { name: 'Reddit', icon: MessageSquare, color: 'text-orange-600', bgColor: 'bg-orange-500/10', description: 'Community discussions' },
};

interface PlatformCardProps {
  platform: SocialPlatform;
  connection?: SocialConnection;
  stats?: {
    interactions: number;
    trend: number;
    autoResponseRate: number;
  };
}

function PlatformCard({ platform, connection, stats }: PlatformCardProps) {
  const config = PLATFORM_CONFIG[platform];
  const { toggleAutoRespond, toggleActive } = useSocialConnections();
  const Icon = config.icon;
  const isConnected = connection?.is_active;

  const handleToggleAutoRespond = () => {
    if (connection) {
      toggleAutoRespond.mutate({
        connectionId: connection.id,
        enabled: !connection.auto_respond_enabled,
      });
    }
  };

  const handleToggleActive = () => {
    if (connection) {
      toggleActive.mutate({
        connectionId: connection.id,
        active: !connection.is_active,
      });
    }
  };

  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      !isConnected && "opacity-60"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", config.bgColor)}>
              <Icon className={cn("h-5 w-5", config.color)} />
            </div>
            <div>
              <CardTitle className="text-base">{config.name}</CardTitle>
              <CardDescription className="text-xs">{config.description}</CardDescription>
            </div>
          </div>
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {connection && isConnected ? (
          <>
            {/* Account Info */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Account</span>
              <span className="font-medium">
                {connection.page_name || connection.platform_username || 'Connected'}
              </span>
            </div>

            {/* Stats */}
            {stats && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Interactions (30d)</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{stats.interactions}</span>
                    {stats.trend !== 0 && (
                      <span className={cn(
                        "flex items-center text-xs",
                        stats.trend > 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {stats.trend > 0 ? (
                          <TrendingUp className="h-3 w-3 mr-0.5" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-0.5" />
                        )}
                        {Math.abs(stats.trend)}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Auto-response</span>
                    <span className="font-medium">{stats.autoResponseRate}%</span>
                  </div>
                  <Progress value={stats.autoResponseRate} className="h-1.5" />
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="pt-2 border-t space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Auto-respond</span>
                <Switch
                  checked={connection.auto_respond_enabled}
                  onCheckedChange={handleToggleAutoRespond}
                  disabled={toggleAutoRespond.isPending}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Active</span>
                <Switch
                  checked={connection.is_active}
                  onCheckedChange={handleToggleActive}
                  disabled={toggleActive.isPending}
                />
              </div>
            </div>

            <Button variant="outline" size="sm" className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              Connect your {config.name} account to start engaging
            </p>
            <Button size="sm" className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              Connect {config.name}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PlatformOverview({ organizationId }: PlatformOverviewProps) {
  const { connections, isLoading } = useSocialConnections(organizationId);

  // Mock stats - in production, fetch from social_engagement_metrics
  const platformStats: Record<SocialPlatform, { interactions: number; trend: number; autoResponseRate: number }> = {
    facebook: { interactions: 156, trend: 12, autoResponseRate: 85 },
    instagram: { interactions: 243, trend: 8, autoResponseRate: 72 },
    x: { interactions: 89, trend: -3, autoResponseRate: 68 },
    whatsapp: { interactions: 67, trend: 15, autoResponseRate: 92 },
    linkedin: { interactions: 45, trend: 5, autoResponseRate: 78 },
    tiktok: { interactions: 0, trend: 0, autoResponseRate: 0 },
    reddit: { interactions: 0, trend: 0, autoResponseRate: 0 },
  };

  const platforms: SocialPlatform[] = ['facebook', 'instagram', 'x', 'whatsapp', 'linkedin'];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {platforms.map(platform => (
          <Card key={platform} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-10 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-8 bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {platforms.map(platform => (
        <PlatformCard
          key={platform}
          platform={platform}
          connection={connections.find(c => c.platform === platform)}
          stats={platformStats[platform]}
        />
      ))}
    </div>
  );
}
