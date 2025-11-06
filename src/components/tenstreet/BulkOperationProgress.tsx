import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, FileUp, FileDown, RefreshCw } from 'lucide-react';
import { useBulkOperationStatus } from '@/hooks/useBulkOperationStatus';
import { formatDistanceToNow } from 'date-fns';

export function BulkOperationProgress() {
  const { activeOperations, recentOperations, isLoading, hasActiveOperations } = useBulkOperationStatus();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'import':
        return <FileUp className="h-4 w-4" />;
      case 'export':
        return <FileDown className="h-4 w-4" />;
      case 'sync':
        return <RefreshCw className="h-4 w-4" />;
      default:
        return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'in_progress':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      default:
        return null;
    }
  };

  if (!hasActiveOperations && recentOperations.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No bulk operations in progress
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Active Operations */}
      {hasActiveOperations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Operations In Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeOperations.map((operation) => (
              <div key={operation.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getOperationIcon(operation.operation_type)}
                    <span className="font-medium capitalize">
                      {operation.operation_type.replace('_', ' ')}
                    </span>
                  </div>
                  <Badge variant="secondary">Processing</Badge>
                </div>
                <Progress value={operation.total_records > 0 ? (operation.processed_records / operation.total_records * 100) : 0} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{operation.processed_records} / {operation.total_records} records processed</span>
                  <span>Started {formatDistanceToNow(new Date(operation.created_at), { addSuffix: true })}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Operations */}
      {recentOperations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOperations.map((operation) => (
                <div
                  key={operation.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(operation.status)}
                    <div>
                      <div className="font-medium capitalize flex items-center gap-2">
                        {getOperationIcon(operation.operation_type)}
                        {operation.operation_type.replace('_', ' ')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {operation.processed_records} records • {formatDistanceToNow(new Date(operation.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {operation.failed_records > 0 && (
                      <Badge variant="destructive">{operation.failed_records} errors</Badge>
                    )}
                    <Badge variant={operation.status === 'completed' ? 'default' : operation.status === 'failed' ? 'destructive' : 'secondary'}>
                      {operation.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {hasActiveOperations && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Auto-refreshing every 10 seconds</span>
        </div>
      )}
    </div>
  );
}
