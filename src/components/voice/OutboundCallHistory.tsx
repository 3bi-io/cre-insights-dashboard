import { Phone, PhoneCall, PhoneOff, Clock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useOutboundCalls } from '@/features/elevenlabs/hooks';
import type { OutboundCallStatus } from '@/features/elevenlabs/types/outboundCall';

interface OutboundCallHistoryProps {
  applicationId?: string;
  organizationId?: string;
  showTitle?: boolean;
  maxHeight?: string;
}

const statusConfig: Record<OutboundCallStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  queued: { label: 'Queued', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
  initiating: { label: 'Initiating', variant: 'secondary', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  initiated: { label: 'Initiated', variant: 'default', icon: <Phone className="h-3 w-3" /> },
  ringing: { label: 'Ringing', variant: 'default', icon: <PhoneCall className="h-3 w-3" /> },
  in_progress: { label: 'In Progress', variant: 'default', icon: <PhoneCall className="h-3 w-3" /> },
  completed: { label: 'Completed', variant: 'outline', icon: <CheckCircle className="h-3 w-3" /> },
  failed: { label: 'Failed', variant: 'destructive', icon: <AlertCircle className="h-3 w-3" /> },
  no_answer: { label: 'No Answer', variant: 'secondary', icon: <PhoneOff className="h-3 w-3" /> },
  busy: { label: 'Busy', variant: 'secondary', icon: <PhoneOff className="h-3 w-3" /> },
  cancelled: { label: 'Cancelled', variant: 'secondary', icon: <PhoneOff className="h-3 w-3" /> },
};

export const OutboundCallHistory = ({ 
  applicationId, 
  organizationId,
  showTitle = true,
  maxHeight = '400px'
}: OutboundCallHistoryProps) => {
  const { 
    outboundCalls, 
    isLoading, 
    processQueuedCall, 
    isProcessing,
    cancelCall,
    isCancelling 
  } = useOutboundCalls({ applicationId, organizationId });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const formatPhoneNumber = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return phone;
  };

  if (isLoading) {
    return (
      <Card>
        {showTitle && (
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <PhoneCall className="h-5 w-5" />
              Outbound Calls
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <PhoneCall className="h-5 w-5" />
            Outbound Calls
          </CardTitle>
          <CardDescription>
            History of automated outbound calls to applicants
          </CardDescription>
        </CardHeader>
      )}
      <CardContent>
        {outboundCalls.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No outbound calls yet
          </p>
        ) : (
          <ScrollArea style={{ maxHeight }} className="pr-4">
            <div className="space-y-3">
              {outboundCalls.map((call) => {
                const status = statusConfig[call.status] || statusConfig.queued;
                const applicantName = call.application 
                  ? `${call.application.first_name || ''} ${call.application.last_name || ''}`.trim()
                  : call.metadata?.applicant_name as string || 'Unknown';

                return (
                  <div 
                    key={call.id} 
                    className="flex items-start justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant={status.variant} className="flex items-center gap-1">
                          {status.icon}
                          {status.label}
                        </Badge>
                        {call.voice_agent && (
                          <span className="text-xs text-muted-foreground truncate">
                            via {call.voice_agent.name}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm font-medium truncate">
                        {applicantName}
                      </p>
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {formatPhoneNumber(call.phone_number)}
                        </span>
                        <span>{formatDate(call.created_at)}</span>
                        {call.duration_seconds && (
                          <span>{formatDuration(call.duration_seconds)}</span>
                        )}
                      </div>

                      {call.error_message && (
                        <p className="text-xs text-destructive mt-1 truncate">
                          {call.error_message}
                        </p>
                      )}
                    </div>

                    {call.status === 'queued' && (
                      <div className="flex gap-2 ml-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => processQueuedCall(call.id)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            'Process'
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => cancelCall(call.id)}
                          disabled={isCancelling}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
