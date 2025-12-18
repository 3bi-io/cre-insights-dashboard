import { useActiveUsers } from '@/hooks/useActiveUsers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  RefreshCw, 
  Monitor, 
  Smartphone, 
  Tablet,
  Circle,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ActiveUsersIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

const DeviceIcon = ({ type }: { type: string }) => {
  const iconClass = "h-3 w-3";
  switch (type?.toLowerCase()) {
    case 'mobile':
      return <Smartphone className={iconClass} />;
    case 'tablet':
      return <Tablet className={iconClass} />;
    default:
      return <Monitor className={iconClass} />;
  }
};

export const ActiveUsersIndicator = ({ 
  showDetails = false,
  className 
}: ActiveUsersIndicatorProps) => {
  const { count, sessions, lastUpdated, isLoading, refresh } = useActiveUsers(30000);

  // Group sessions by device type
  const deviceBreakdown = sessions.reduce((acc, session) => {
    const device = session.device_type?.toLowerCase() || 'desktop';
    acc[device] = (acc[device] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (!showDetails) {
    // Compact indicator for headers/sidebars
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="relative">
          <Circle 
            className={cn(
              "h-2 w-2 fill-current",
              count > 0 ? "text-emerald-500 animate-pulse" : "text-muted-foreground"
            )} 
          />
        </div>
        <span className="text-sm font-medium">
          {isLoading ? '...' : count} active
        </span>
      </div>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <div className="relative">
            <Users className="h-4 w-4 text-muted-foreground" />
            {count > 0 && (
              <Circle 
                className="h-2 w-2 fill-emerald-500 text-emerald-500 absolute -top-0.5 -right-0.5 animate-pulse" 
              />
            )}
          </div>
          Live Visitors
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={refresh}
          disabled={isLoading}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">
            {isLoading ? '—' : count}
          </span>
          <Badge 
            variant={count > 0 ? "default" : "secondary"}
            className={cn(
              "text-xs",
              count > 0 && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
            )}
          >
            {count > 0 ? 'Online Now' : 'No Active Users'}
          </Badge>
        </div>

        {/* Device breakdown */}
        {count > 0 && Object.keys(deviceBreakdown).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(deviceBreakdown).map(([device, deviceCount]) => (
              <div 
                key={device}
                className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full"
              >
                <DeviceIcon type={device} />
                <span className="capitalize">{device}</span>
                <span className="font-medium">{deviceCount}</span>
              </div>
            ))}
          </div>
        )}

        {/* Last updated */}
        <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
          </span>
        </div>

        {/* Active sessions list */}
        {showDetails && count > 0 && sessions.length > 0 && (
          <div className="mt-4 border-t pt-4">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">
              Active Sessions
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {sessions.slice(0, 10).map((session) => (
                <div 
                  key={session.session_id}
                  className="flex items-center justify-between text-xs p-2 rounded-md bg-muted/30"
                >
                  <div className="flex items-center gap-2">
                    <DeviceIcon type={session.device_type} />
                    <span className="font-mono text-muted-foreground">
                      {session.visitor_id.slice(0, 8)}...
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>{session.page_count} pages</span>
                    <Circle className="h-1.5 w-1.5 fill-emerald-500 text-emerald-500" />
                  </div>
                </div>
              ))}
              {sessions.length > 10 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{sessions.length - 10} more sessions
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActiveUsersIndicator;
