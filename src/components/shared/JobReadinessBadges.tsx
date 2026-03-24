/**
 * JobReadinessBadges — Visual pipeline showing job readiness stages.
 *
 * Stages progress through: gray → amber → yellow → green
 * When all four are complete, every badge turns green.
 *
 * This is currently visual-only; a future database table will drive the
 * `completedStages` prop dynamically.
 */

import React from 'react';
import { FileText, Users, ShieldCheck, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type JobReadinessStage = 'posted' | 'human_review' | 'final_approval' | 'voice_active';

const STAGES: { key: JobReadinessStage; label: string; icon: React.ElementType; tooltip: string }[] = [
  { key: 'posted', label: 'Posted', icon: FileText, tooltip: 'Job has been posted' },
  { key: 'human_review', label: 'Review', icon: Users, tooltip: 'Human review of intake calls' },
  { key: 'final_approval', label: 'Approved', icon: ShieldCheck, tooltip: 'Final approval by recruiter' },
  { key: 'voice_active', label: 'Voice', icon: Mic, tooltip: 'AI Voice interview is active' },
];

/**
 * Color tiers mapped to stage index when incomplete (gray → amber → yellow → green).
 * Once a stage is complete it always shows green.
 */
const PROGRESS_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  0: { bg: 'bg-muted/60', text: 'text-muted-foreground', border: 'border-muted-foreground/20' },
  1: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-300 dark:border-amber-700' },
  2: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-300 dark:border-yellow-700' },
  3: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/30' },
};

const COMPLETE_COLOR = { bg: 'bg-success/10', text: 'text-success', border: 'border-success/30' };

interface JobReadinessBadgesProps {
  /** Which stages have been completed */
  completedStages: JobReadinessStage[];
  /** Compact mode shows only icons (for small cards) */
  compact?: boolean;
  className?: string;
}

export const JobReadinessBadges: React.FC<JobReadinessBadgesProps> = ({
  completedStages,
  compact = false,
  className,
}) => {
  const allComplete = STAGES.every((s) => completedStages.includes(s.key));

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn('flex items-center gap-1', className)}>
        {STAGES.map((stage, idx) => {
          const isComplete = completedStages.includes(stage.key);
          const colors = isComplete || allComplete
            ? COMPLETE_COLOR
            : PROGRESS_COLORS[idx] ?? PROGRESS_COLORS[0];
          const Icon = stage.icon;

          return (
            <Tooltip key={stage.key}>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold transition-colors select-none',
                    colors.bg,
                    colors.text,
                    colors.border,
                  )}
                  aria-label={`${stage.label}: ${isComplete ? 'complete' : 'pending'}`}
                >
                  <Icon className="h-3 w-3" aria-hidden="true" />
                  {!compact && <span className="hidden sm:inline">{stage.label}</span>}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs max-w-[180px]">
                <p>
                  <span className="font-semibold">{stage.label}</span>
                  {' — '}
                  {isComplete ? 'Complete ✓' : stage.tooltip}
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};
