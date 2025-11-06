import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { useXchangeStatusPolling } from '@/hooks/useXchangeStatusPolling';
import { formatDistanceToNow } from 'date-fns';

interface RealTimeStatusMonitorProps {
  applicationId: string;
}

export function RealTimeStatusMonitor({ applicationId }: RealTimeStatusMonitorProps) {
  const { requests, isLoading, pendingCount, completedCount, failedCount, hasActiveRequests } = 
    useXchangeStatusPolling({ applicationId });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No screening requests found
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'in_progress':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      failed: 'destructive',
      in_progress: 'secondary',
      pending: 'outline'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
            {hasActiveRequests && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Currently processing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground">Successfully completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedCount}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Request List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Screening Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {requests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(request.status)}
                  <div>
                    <div className="font-medium capitalize">
                      {request.request_type.replace('_', ' ')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Requested {formatDistanceToNow(new Date(request.request_date), { addSuffix: true })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right text-sm">
                    ${(request.cost_cents / 100).toFixed(2)}
                  </div>
                  {getStatusBadge(request.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {hasActiveRequests && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Auto-refreshing every 30 seconds</span>
        </div>
      )}
    </div>
  );
}
