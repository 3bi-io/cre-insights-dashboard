/**
 * Mobile Map/List View Switcher
 * Provides a toggle between map view and list view on mobile devices.
 */

import { memo } from 'react';
import { Map, List } from 'lucide-react';
import { Button } from '@/components/design-system/Button';
import { cn } from '@/lib/utils';

export type MobileViewMode = 'map' | 'list';

interface MobileViewSwitcherProps {
  mode: MobileViewMode;
  onModeChange: (mode: MobileViewMode) => void;
  className?: string;
}

export const MobileViewSwitcher = memo(function MobileViewSwitcher({
  mode,
  onModeChange,
  className,
}: MobileViewSwitcherProps) {
  return (
    <div
      className={cn(
        'flex bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-border p-0.5',
        className
      )}
      role="tablist"
      aria-label="Switch between map and list view"
    >
      <Button
        variant={mode === 'map' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('map')}
        className={cn('h-9 px-3 gap-1.5 rounded-md', mode !== 'map' && 'text-muted-foreground')}
        role="tab"
        aria-selected={mode === 'map'}
        aria-controls="map-panel"
      >
        <Map className="w-4 h-4" aria-hidden="true" />
        Map
      </Button>
      <Button
        variant={mode === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('list')}
        className={cn('h-9 px-3 gap-1.5 rounded-md', mode !== 'list' && 'text-muted-foreground')}
        role="tab"
        aria-selected={mode === 'list'}
        aria-controls="list-panel"
      >
        <List className="w-4 h-4" aria-hidden="true" />
        List
      </Button>
    </div>
  );
});

export default MobileViewSwitcher;
