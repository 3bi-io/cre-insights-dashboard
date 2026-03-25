import React from 'react';
import { Badge } from '@/components/ui/badge';

interface ReadinessBadgesProps {
  /** Whether voice apply is available for this job */
  showVoiceApply: boolean;
  className?: string;
}

const STAGES = [
  'Manual Apply Ready',
  'AI Under Human Review',
  'AI Approved',
  'Voice Apply Enabled',
] as const;

/**
 * Four-stage readiness pipeline badges.
 * If voice apply is enabled → all 4 green.
 * Otherwise → only "Manual Apply Ready" is green, rest gray.
 */
export const ReadinessBadges: React.FC<ReadinessBadgesProps> = ({ showVoiceApply, className = '' }) => (
  <div className={`flex flex-wrap gap-1.5 ${className}`}>
    {STAGES.map((label, i) => {
      const active = i === 0 || showVoiceApply;
      return (
        <Badge
          key={label}
          variant="outline"
          className={`text-[9px] font-medium px-1.5 py-0.5 ${
            active
              ? 'bg-success/10 text-success border-success/30'
              : 'bg-muted/50 text-muted-foreground/50 border-border/50'
          }`}
        >
          <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${active ? 'bg-success' : 'bg-muted-foreground/30'}`} />
          {label}
        </Badge>
      );
    })}
  </div>
);
