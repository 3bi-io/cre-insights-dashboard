import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Rss,
  ArrowUpCircle,
  ArrowDownCircle,
  Loader2
} from 'lucide-react';
import { useFeedSyncStatus, useTriggerFeedSync, useFeedQualityAlerts, useAcknowledgeAlert } from '../hooks/useFeedSyncStatus';
import { formatDistanceToNow } from 'date-fns';

export function FeedSyncStatusCard() {
  const { data: syncStatus, isLoading: statusLoading, refetch } = useFeedSyncStatus();
  const { data: alerts, isLoading: alertsLoading } = useFeedQualityAlerts();
  const triggerSync = useTriggerFeedSync();
  const acknowledgeAlert = useAcknowledgeAlert();

  if (statusLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  const lastSync = syncStatus?.lastSync;
  const hasAlerts = alerts && alerts.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Rss className="h-5 w-5" />
          Feed Sync Status
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()}
          disabled={triggerSync.isPending}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Last Sync Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Last sync:</span>
          </div>
          <div className="flex items-center gap-2">
            {lastSync ? (
              <>
                <span className="text-sm font-medium">
                  {formatDistanceToNow(new Date(lastSync.created_at), { addSuffix: true })}
                </span>
                {lastSync.error ? (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Error
                  </Badge>
                ) : (
                  <Badge variant="default" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Success
                  </Badge>
                )}
              </>
            ) : (
              <span className="text-sm text-muted-foreground">Never</span>
            )}
          </div>
        </div>

        {/* Sync Stats */}
        {lastSync && !lastSync.error && (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
              <ArrowUpCircle className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Updated</p>
                <p className="text-lg font-bold">{syncStatus?.totalJobsUpdated || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
              <ArrowDownCircle className="h-4 w-4 text-accent-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Inserted</p>
                <p className="text-lg font-bold">{syncStatus?.totalJobsInserted || 0}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {lastSync?.error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {lastSync.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Quality Alerts */}
        {hasAlerts && !alertsLoading && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Quality Alerts</p>
            {alerts.slice(0, 2).map((alert: any) => (
              <Alert 
                key={alert.id} 
                variant={alert.severity === 'critical' ? 'destructive' : 'default'}
                className="py-2"
              >
                <AlertDescription className="flex items-center justify-between">
                  <span className="text-xs">{alert.message}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => acknowledgeAlert.mutate(alert.id)}
                  >
                    Dismiss
                  </Button>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Trigger Sync Button */}
        <Button 
          className="w-full" 
          onClick={() => triggerSync.mutate()}
          disabled={triggerSync.isPending}
        >
          {triggerSync.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Trigger Manual Sync
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
