/**
 * Enhanced Job List Panel Component
 * Shows confidence badge and plotted location details
 */

import { memo } from 'react';
import { MapLocation } from '@/hooks/useJobMapData';
import { X, MapPin, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/design-system/Button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { LocationConfidenceBadge } from './LocationConfidenceBadge';
import { cn } from '@/lib/utils';
import { useMapContextOptional } from './MapContext';
import { DRAWER_SNAP_POINTS, DEFAULT_DRAWER_SNAP, SHEET_WIDTH_DESKTOP, SHEET_WIDTH_TABLET } from './constants';
import { useIsMobile } from '@/hooks/use-mobile';
import { VirtualJobList } from './VirtualJobList';

interface JobListPanelProps {
  location: MapLocation | null;
  onClose: () => void;
}

const JobListContent = memo(function JobListContent({ 
  location, 
  onClose,
  isMobile,
}: { 
  location: MapLocation; 
  onClose: () => void;
  isMobile: boolean;
  isTablet: boolean;
}) {
  return (
    <div className={cn("flex flex-col h-full", isMobile && "pb-safe")}>
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-semibold text-lg flex items-center gap-1.5 truncate">
                <MapPin className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
                <span className="truncate">{location.displayName}</span>
              </h2>
              <LocationConfidenceBadge confidence={location.confidence} size="md" />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {location.jobCount} {location.jobCount === 1 ? 'job' : 'jobs'} available
            </p>
            {/* Plotted location detail */}
            <p className="text-xs text-muted-foreground mt-0.5">
              {location.confidence === 'exact' 
                ? `📍 Plotted at ${location.city}, ${location.state}` 
                : location.confidence === 'state'
                ? `📍 Approximate — state center for ${location.state}`
                : `📍 Approximate — country-level placement`
              }
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="shrink-0 -mr-2 -mt-2"
            aria-label="Close job list"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {location.companies.length > 0 && (
          <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
            <Building2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {location.companies.slice(0, 3).join(', ')}
              {location.companies.length > 3 && ` +${location.companies.length - 3} more`}
            </span>
          </div>
        )}

        {location.topCategories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3" role="list" aria-label="Job categories">
            {location.topCategories.map((category) => (
              <Badge key={category} variant="outline" className="text-xs" role="listitem">
                {category}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <VirtualJobList
        jobs={location.jobs}
        isMobile={isMobile}
        locationName={location.displayName}
        onClose={onClose}
      />
    </div>
  );
});

export const JobListPanel = memo(function JobListPanel({
  location,
  onClose,
}: JobListPanelProps) {
  const mapContext = useMapContextOptional();
  const isMobileFallback = useIsMobile();
  const isMobile = mapContext?.isMobile ?? isMobileFallback;
  const isTablet = mapContext?.isTablet ?? false;
  const isOpen = location !== null;

  if (!location) return null;

  if (isMobile) {
    return (
      <Drawer 
        open={isOpen} 
        onOpenChange={(open) => !open && onClose()}
        snapPoints={DRAWER_SNAP_POINTS}
        activeSnapPoint={DEFAULT_DRAWER_SNAP}
        fadeFromIndex={0}
      >
        <DrawerContent 
          className="max-h-[95dvh] focus:outline-none"
          aria-describedby="drawer-description"
        >
          <div className="mx-auto mt-2 mb-1 h-1.5 w-12 rounded-full bg-muted" aria-hidden="true" />
          <DrawerHeader className="sr-only">
            <DrawerTitle>Jobs in {location.displayName}</DrawerTitle>
            <DrawerDescription id="drawer-description">
              View {location.jobCount} job opportunities in this location
            </DrawerDescription>
          </DrawerHeader>
          <JobListContent location={location} onClose={onClose} isMobile={true} isTablet={false} />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        className={cn("p-0 focus:outline-none", isTablet ? SHEET_WIDTH_TABLET : SHEET_WIDTH_DESKTOP)}
        side="right"
        aria-describedby="sheet-description"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Jobs in {location.displayName}</SheetTitle>
          <SheetDescription id="sheet-description">
            View {location.jobCount} job opportunities in this location
          </SheetDescription>
        </SheetHeader>
        <JobListContent location={location} onClose={onClose} isMobile={false} isTablet={isTablet} />
      </SheetContent>
    </Sheet>
  );
});

export default JobListPanel;
