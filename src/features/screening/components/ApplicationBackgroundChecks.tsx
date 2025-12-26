import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, Plus, ExternalLink, Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useApplicationBackgroundChecks } from '../hooks/useBackgroundChecks';
import { InitiateBackgroundCheckDialog } from './InitiateBackgroundCheckDialog';
import type { BGCRequest } from '../services/BackgroundCheckService';

interface ApplicationBackgroundChecksProps {
  applicationId: string;
  applicantName: string;
  organizationId: string;
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Clock, color: 'text-yellow-500', label: 'Pending' },
  processing: { icon: Loader2, color: 'text-blue-500', label: 'Processing' },
  waiting_on_candidate: { icon: AlertCircle, color: 'text-orange-500', label: 'Awaiting Candidate' },
  completed: { icon: CheckCircle, color: 'text-green-500', label: 'Completed' },
  failed: { icon: XCircle, color: 'text-red-500', label: 'Failed' },
  cancelled: { icon: XCircle, color: 'text-muted-foreground', label: 'Cancelled' }
};

const RESULT_BADGES: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
  clear: { variant: 'default', label: 'Clear' },
  consider: { variant: 'secondary', label: 'Consider' },
  adverse: { variant: 'destructive', label: 'Adverse Action' }
};

export function ApplicationBackgroundChecks({
  applicationId,
  applicantName,
  organizationId
}: ApplicationBackgroundChecksProps) {
  const { data: requests, isLoading } = useApplicationBackgroundChecks(applicationId);
  const [showInitiateDialog, setShowInitiateDialog] = useState(false);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCost = (cents: number | null) => {
    if (!cents) return '-';
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Background Checks
          </CardTitle>
          <Button size="sm" onClick={() => setShowInitiateDialog(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New Check
          </Button>
        </CardHeader>
        <CardContent>
          {requests && requests.length > 0 ? (
            <div className="space-y-3">
              {requests.map(request => {
                const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.pending;
                const StatusIcon = statusConfig.icon;
                const resultBadge = request.result ? RESULT_BADGES[request.result] : null;

                return (
                  <div
                    key={request.id}
                    className="flex items-start justify-between p-3 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`h-4 w-4 ${statusConfig.color} ${request.status === 'processing' ? 'animate-spin' : ''}`} />
                        <span className="font-medium text-sm">
                          {(request as any).provider?.name || 'Background Check'}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {request.check_type}
                        </Badge>
                        {resultBadge && (
                          <Badge variant={resultBadge.variant} className="text-xs">
                            {resultBadge.label}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <span>Initiated: {formatDate(request.created_at)}</span>
                        {request.completed_at && (
                          <span className="ml-3">Completed: {formatDate(request.completed_at)}</span>
                        )}
                        {request.cost_cents && (
                          <span className="ml-3">Cost: {formatCost(request.cost_cents)}</span>
                        )}
                      </div>
                      {request.external_id && (
                        <div className="text-xs text-muted-foreground">
                          ID: {request.external_id}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {request.candidate_portal_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a href={request.candidate_portal_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Portal
                          </a>
                        </Button>
                      )}
                      {request.report_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a href={request.report_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Report
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No background checks initiated</p>
              <Button
                variant="link"
                size="sm"
                className="mt-1"
                onClick={() => setShowInitiateDialog(true)}
              >
                Start a background check
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <InitiateBackgroundCheckDialog
        open={showInitiateDialog}
        onOpenChange={setShowInitiateDialog}
        applicationId={applicationId}
        applicantName={applicantName}
        organizationId={organizationId}
      />
    </>
  );
}

export default ApplicationBackgroundChecks;
