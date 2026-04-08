/**
 * Map Theme Switcher
 * Compact Light / Dark / Device selector for the map shell
 */

import { memo } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/ThemeProvider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const OPTIONS = [
  { value: 'light' as const, label: 'Light', icon: Sun },
  { value: 'system' as const, label: 'Device', icon: Monitor },
  { value: 'dark' as const, label: 'Dark', icon: Moon },
] as const;

export const MapThemeSwitcher = memo(function MapThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn(
          'flex bg-background/90 backdrop-blur-md rounded-lg shadow-lg border border-border/50 p-0.5',
          className,
        )}
        role="radiogroup"
        aria-label="Map theme"
      >
        {OPTIONS.map(({ value, label, icon: Icon }) => {
          const isActive = theme === value;
          return (
            <Tooltip key={value}>
              <TooltipTrigger asChild>
                <button
                  role="radio"
                  aria-checked={isActive}
                  aria-label={`${label} theme`}
                  onClick={() => setTheme(value)}
                  className={cn(
                    'flex items-center justify-center rounded-md transition-all duration-200',
                    'h-8 w-8',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                  )}
                >
                  <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" sideOffset={8}>
                <p className="text-xs">{label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
});

export default MapThemeSwitcher;
