/**
 * Location Confidence Badge
 * Visual indicator showing whether a marker represents an exact city,
 * a state-level fallback, or a country-level fallback.
 */

import { memo } from 'react';
import { MapPin, Navigation, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type LocationConfidence = 'exact' | 'state' | 'country';

interface LocationConfidenceBadgeProps {
  confidence: LocationConfidence;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

const CONFIDENCE_CONFIG: Record<LocationConfidence, {
  label: string;
  description: string;
  icon: typeof MapPin;
  badgeClass: string;
}> = {
  exact: {
    label: 'Exact city',
    description: 'Plotted at the exact city location',
    icon: Navigation,
    badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  },
  state: {
    label: 'State area',
    description: 'City not found — placed at the state center',
    icon: MapPin,
    badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
  },
  country: {
    label: 'Country area',
    description: 'Placed at the country center (international)',
    icon: Globe,
    badgeClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
  },
};

export const LocationConfidenceBadge = memo(function LocationConfidenceBadge({
  confidence,
  className,
  showLabel = true,
  size = 'sm',
}: LocationConfidenceBadgeProps) {
  const config = CONFIDENCE_CONFIG[confidence];
  const Icon = config.icon;
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'gap-1 font-normal cursor-default',
              size === 'sm' ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5',
              config.badgeClass,
              className
            )}
          >
            <Icon className={iconSize} aria-hidden="true" />
            {showLabel && config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px]">
          <p className="text-xs">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

export default LocationConfidenceBadge;
