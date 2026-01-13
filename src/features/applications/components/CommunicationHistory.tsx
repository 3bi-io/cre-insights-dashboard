import React from 'react';
import { useCommunicationLogs } from '../hooks/useCommunicationLogs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mail, MessageSquare, Phone, AlertCircle, CheckCircle, Clock, Eye, MousePointer, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface CommunicationHistoryProps {
  applicationId: string;
  maxHeight?: string;
  showTitle?: boolean;
}

const CHANNEL_CONFIG = {
  email: { icon: Mail, label: 'Email', color: 'text-purple-600' },
  sms: { icon: MessageSquare, label: 'SMS', color: 'text-green-600' },
  call: { icon: Phone, label: 'Call', color: 'text-blue-600' },
};

const STATUS_CONFIG: Record<string, { icon: React.ElementType; label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { icon: Clock, label: 'Pending', variant: 'secondary' },
  sent: { icon: CheckCircle, label: 'Sent', variant: 'outline' },
  delivered: { icon: CheckCircle, label: 'Delivered', variant: 'default' },
  opened: { icon: Eye, label: 'Opened', variant: 'default' },
  clicked: { icon: MousePointer, label: 'Clicked', variant: 'default' },
  bounced: { icon: XCircle, label: 'Bounced', variant: 'destructive' },
  failed: { icon: XCircle, label: 'Failed', variant: 'destructive' },
};

export const CommunicationHistory: React.FC<CommunicationHistoryProps> = ({
  applicationId,
  maxHeight = '400px',
  showTitle = true,
}) => {
  const { logs, isLoading, error } = useCommunicationLogs(applicationId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {showTitle && <h4 className="text-sm font-medium text-muted-foreground">Communication History</h4>}
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-destructive text-sm py-4">
        <AlertCircle className="w-4 h-4" />
        <span>Failed to load communication history</span>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No communications recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {showTitle && (
        <h4 className="text-sm font-medium text-muted-foreground">
          Communication History ({logs.length})
        </h4>
      )}
      <ScrollArea style={{ maxHeight }} className="pr-2">
        <div className="space-y-3">
          {logs.map((log) => {
            const channelConfig = CHANNEL_CONFIG[log.channel];
            const statusConfig = STATUS_CONFIG[log.status] || STATUS_CONFIG.sent;
            const ChannelIcon = channelConfig.icon;
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card"
              >
                {/* Channel Icon */}
                <div className={cn('p-2 rounded-full bg-muted', channelConfig.color)}>
                  <ChannelIcon className="w-4 h-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {log.direction === 'outbound' ? 'Sent' : 'Received'} {channelConfig.label}
                      </span>
                      <Badge variant={statusConfig.variant} className="text-xs h-5">
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(log.sent_at), { addSuffix: true })}
                    </span>
                  </div>

                  {/* Subject */}
                  {log.subject && (
                    <p className="text-sm font-medium truncate">{log.subject}</p>
                  )}

                  {/* Preview */}
                  {log.body_preview && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {log.body_preview}
                    </p>
                  )}

                  {/* Recipient */}
                  <p className="text-xs text-muted-foreground">
                    To: {log.recipient}
                  </p>

                  {/* Delivery timestamps */}
                  {(log.delivered_at || log.opened_at || log.clicked_at) && (
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground pt-1">
                      {log.delivered_at && (
                        <span>Delivered {formatDistanceToNow(new Date(log.delivered_at), { addSuffix: true })}</span>
                      )}
                      {log.opened_at && (
                        <span>• Opened {formatDistanceToNow(new Date(log.opened_at), { addSuffix: true })}</span>
                      )}
                      {log.clicked_at && (
                        <span>• Clicked {formatDistanceToNow(new Date(log.clicked_at), { addSuffix: true })}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CommunicationHistory;
