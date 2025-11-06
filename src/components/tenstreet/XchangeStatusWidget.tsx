import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink } from 'lucide-react';
import { useXchangeStatusPolling } from '@/hooks/useXchangeStatusPolling';

interface XchangeStatusWidgetProps {
  applicationId: string;
  onViewDetails?: () => void;
}

export function XchangeStatusWidget({ applicationId, onViewDetails }: XchangeStatusWidgetProps) {
  const { requests, isLoading, pendingCount, completedCount, hasActiveRequests } = 
    useXchangeStatusPolling({ applicationId });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!requests || requests.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm font-medium">Screening Status</div>
            <div className="flex items-center gap-2">
              {hasActiveRequests && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {pendingCount} Active
                </Badge>
              )}
              {completedCount > 0 && (
                <Badge variant="default">
                  {completedCount} Completed
                </Badge>
              )}
            </div>
          </div>

          {onViewDetails && (
            <Button variant="outline" size="sm" onClick={onViewDetails}>
              View Details
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
