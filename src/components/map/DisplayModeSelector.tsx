/**
 * Display Mode Selector
 * Segmented control for Standard / Density / Detail map modes
 */

import { memo } from 'react';
import { Layers, Maximize2, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { DisplayMode } from './constants';

interface DisplayModeSelectorProps {
  mode: DisplayMode;
  onModeChange: (mode: DisplayMode) => void;
  compact?: boolean;
  className?: string;
}

const MODES: { value: DisplayMode; label: string; shortLabel: string; icon: typeof Layers; description: string }[] = [
  {
    value: 'standard',
    label: 'Standard',
    shortLabel: 'Std',
    icon: Layers,
    description: 'Balanced view with clusters and markers',
  },
  {
    value: 'density',
    label: 'Density',
    shortLabel: 'Den',
    icon: Maximize2,
    description: 'Geographic concentration and heat maps',
  },
  {
    value: 'detail',
    label: 'Detail',
    shortLabel: 'Det',
    icon: Eye,
    description: 'Individual markers with rich metadata',
  },
];

export const DisplayModeSelector = memo(function DisplayModeSelector({
  mode,
  onModeChange,
  compact = false,
  className,
}: DisplayModeSelectorProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn(
          'flex bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-border p-0.5',
          className,
        )}
        role="radiogroup"
        aria-label="Map display mode"
      >
        {MODES.map(({ value, label, shortLabel, icon: Icon, description }) => {
          const isActive = mode === value;
          return (
            <Tooltip key={value}>
              <TooltipTrigger asChild>
                <button
                  role="radio"
                  aria-checked={isActive}
                  aria-label={`${label} mode: ${description}`}
                  onClick={() => onModeChange(value)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md text-sm font-medium transition-all duration-200',
                    compact ? 'h-9 px-2.5' : 'h-9 px-3',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                  )}
                >
                  <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className={cn(compact && 'hidden sm:inline')}>
                    {compact ? shortLabel : label}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8}>
                <p className="text-xs">{description}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
});

export default DisplayModeSelector;
