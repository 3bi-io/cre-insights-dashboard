import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface ATSReadinessIndicatorProps {
  score: number | null | undefined;
  compact?: boolean;
}

export const ATSReadinessIndicator: React.FC<ATSReadinessIndicatorProps> = ({ score, compact = false }) => {
  if (score === null || score === undefined) {
    return compact ? null : (
      <Badge variant="outline" className="text-xs text-muted-foreground">
        Not scored
      </Badge>
    );
  }

  const getConfig = () => {
    if (score >= 80) return { 
      label: 'Ready', 
      icon: CheckCircle2, 
      variant: 'default' as const,
      className: 'bg-green-500/10 text-green-700 border-green-200 hover:bg-green-500/20' 
    };
    if (score >= 60) return { 
      label: 'Partial', 
      icon: AlertTriangle, 
      variant: 'secondary' as const,
      className: 'bg-yellow-500/10 text-yellow-700 border-yellow-200 hover:bg-yellow-500/20' 
    };
    return { 
      label: 'Incomplete', 
      icon: XCircle, 
      variant: 'destructive' as const,
      className: 'bg-red-500/10 text-red-700 border-red-200 hover:bg-red-500/20' 
    };
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`text-xs gap-1 ${config.className}`}>
            <Icon className="h-3 w-3" />
            {!compact && config.label}
            {score}%
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>ATS Readiness Score: {score}%</p>
          <p className="text-xs text-muted-foreground">
            {score >= 80 ? 'Ready for auto-post' : score >= 60 ? 'May be posted with gaps' : 'Missing critical fields'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
