import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle2, AlertCircle, XCircle, HelpCircle } from 'lucide-react';

interface ConnectionHealthBadgeProps {
  health: 'active' | 'inactive' | 'error' | 'unknown';
  lastSyncTime?: string | null;
}

export function ConnectionHealthBadge({ health, lastSyncTime }: ConnectionHealthBadgeProps) {
  const getHealthConfig = () => {
    switch (health) {
      case 'active':
        return {
          icon: CheckCircle2,
          label: 'Active',
          variant: 'default' as const,
          className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
          tooltip: 'Connection is healthy. Recent sync activity detected.'
        };
      case 'inactive':
        return {
          icon: AlertCircle,
          label: 'Inactive',
          variant: 'secondary' as const,
          className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
          tooltip: 'No recent sync activity (7+ days). Connection may need attention.'
        };
      case 'error':
        return {
          icon: XCircle,
          label: 'Error',
          variant: 'destructive' as const,
          className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
          tooltip: 'Connection error. Credentials may be inactive or invalid.'
        };
      default:
        return {
          icon: HelpCircle,
          label: 'Unknown',
          variant: 'outline' as const,
          className: 'bg-muted/50 text-muted-foreground border-muted',
          tooltip: 'No credentials configured for this organization.'
        };
    }
  };

  const config = getHealthConfig();
  const Icon = config.icon;

  const tooltipMessage = lastSyncTime
    ? `${config.tooltip}\nLast sync: ${new Date(lastSyncTime).toLocaleString()}`
    : config.tooltip;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={config.variant} className={`${config.className} cursor-help`}>
            <Icon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="whitespace-pre-line">{tooltipMessage}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
