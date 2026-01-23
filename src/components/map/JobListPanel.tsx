/**
 * Enhanced Job List Panel Component
 * Responsive panel for displaying jobs at a location
 * Mobile: Bottom drawer with snap points and swipe gestures
 * Tablet: Narrower sheet from right
 * Desktop: Full-width sheet from right
 */

import { memo, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapLocation } from '@/hooks/useJobMapData';
import { X, MapPin, Building2, DollarSign, Clock, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/design-system/Button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useMapContextOptional } from './MapContext';
import { DRAWER_SNAP_POINTS, DEFAULT_DRAWER_SNAP, SHEET_WIDTH_DESKTOP, SHEET_WIDTH_TABLET } from './constants';
import { useIsMobile } from '@/hooks/use-mobile';

interface JobListPanelProps {
  location: MapLocation | null;
  onClose: () => void;
}

// Format salary display
function formatSalary(min?: number, max?: number, type?: string): string | null {
  if (!min && !max) return null;
  
  const formatAmount = (amount: number) => {
    if (type === 'hourly') return `$${amount}`;
    if (amount >= 1000) return `$${Math.round(amount / 1000)}k`;
    return `$${amount}`;
  };
  
  const suffix = type === 'hourly' ? '/hr' : '/yr';
  
  if (min && max && min !== max) {
    return `${formatAmount(min)} - ${formatAmount(max)}${suffix}`;
  }
  return `${formatAmount(min || max!)}${suffix}`;
}

// Memoized job list content
const JobListContent = memo(function JobListContent({ 
  location, 
  onClose,
  isMobile,
  isTablet,
}: { 
  location: MapLocation; 
  onClose: () => void;
  isMobile: boolean;
  isTablet: boolean;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  // Focus management - focus first job card on open
  useEffect(() => {
    const firstCard = listRef.current?.querySelector('[data-job-index="0"]');
    if (firstCard instanceof HTMLElement) {
      // Delay to allow animation to complete
      setTimeout(() => firstCard.focus(), 100);
    }
  }, [location.id]);

  // Keyboard navigation within the list
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const jobIndex = target.dataset.jobIndex;
    
    if (jobIndex === undefined) return;
    
    const currentIndex = parseInt(jobIndex, 10);
    let nextIndex: number | null = null;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = currentIndex + 1;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = currentIndex - 1;
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    
    if (nextIndex !== null && nextIndex >= 0 && nextIndex < location.jobs.length) {
      const nextCard = listRef.current?.querySelector(`[data-job-index="${nextIndex}"]`);
      if (nextCard instanceof HTMLElement) {
        nextCard.focus();
      }
    }
  }, [location.jobs.length, onClose]);

  return (
    <div 
      className={cn(
        "flex flex-col h-full",
        // On mobile drawer, add extra bottom padding for home indicator
        isMobile && "pb-safe"
      )}
    >
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-semibold text-lg flex items-center gap-1.5 truncate">
                <MapPin className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
                <span className="truncate">{location.displayName}</span>
              </h2>
              {!location.isExact && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  Regional
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {location.jobCount} {location.jobCount === 1 ? 'job' : 'jobs'} available
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

        {/* Companies at location */}
        {location.companies.length > 0 && (
          <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
            <Building2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {location.companies.slice(0, 3).join(', ')}
              {location.companies.length > 3 && ` +${location.companies.length - 3} more`}
            </span>
          </div>
        )}

        {/* Top categories */}
        {location.topCategories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3" role="list" aria-label="Job categories">
            {location.topCategories.map((category) => (
              <Badge 
                key={category} 
                variant="outline" 
                className="text-xs"
                role="listitem"
              >
                {category}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Job List */}
      <ScrollArea className="flex-1">
        <div 
          ref={listRef}
          className="p-4 space-y-3"
          role="list"
          aria-label={`Jobs in ${location.displayName}`}
          onKeyDown={handleKeyDown}
        >
          {location.jobs.map((job, index) => {
            const salary = formatSalary(job.salary_min, job.salary_max, job.salary_type);
            const companyName = job.clients?.name || job.organizations?.name;
            
            return (
              <article
                key={job.id}
                data-job-index={index}
                tabIndex={0}
                role="listitem"
                aria-labelledby={`job-title-${job.id}`}
                className={cn(
                  "block p-4 rounded-lg border border-border bg-card",
                  "transition-all duration-200",
                  "hover:border-primary/50 hover:shadow-md",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  // Larger touch target on mobile
                  isMobile && "min-h-[80px]"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 
                      id={`job-title-${job.id}`}
                      className="font-semibold text-base truncate"
                    >
                      {job.title || job.job_title}
                    </h3>
                    
                    {companyName && (
                      <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">{companyName}</span>
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                      {salary && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" aria-hidden="true" />
                          {salary}
                        </span>
                      )}
                      {job.created_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" aria-hidden="true" />
                          {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                        </span>
                      )}
                    </div>

                    {job.job_summary && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {job.job_summary}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-border">
                  <Link
                    to={`/jobs/${job.id}`}
                    className={cn(
                      "inline-flex items-center gap-1.5 text-sm font-medium text-primary",
                      "hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded",
                      // Larger touch target
                      "py-1 -my-1"
                    )}
                  >
                    View Details
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
});

export const JobListPanel = memo(function JobListPanel({
  location,
  onClose,
}: JobListPanelProps) {
  const mapContext = useMapContextOptional();
  const isMobileFallback = useIsMobile();
  
  // Use context if available, fallback to hook
  const isMobile = mapContext?.isMobile ?? isMobileFallback;
  const isTablet = mapContext?.isTablet ?? false;
  const isOpen = location !== null;

  if (!location) return null;

  // Mobile: Use bottom drawer with snap points
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
          {/* Drag handle for mobile */}
          <div className="mx-auto mt-2 mb-1 h-1.5 w-12 rounded-full bg-muted" aria-hidden="true" />
          
          <DrawerHeader className="sr-only">
            <DrawerTitle>Jobs in {location.displayName}</DrawerTitle>
            <DrawerDescription id="drawer-description">
              View {location.jobCount} job opportunities in this location
            </DrawerDescription>
          </DrawerHeader>
          
          <JobListContent 
            location={location} 
            onClose={onClose} 
            isMobile={true}
            isTablet={false}
          />
        </DrawerContent>
      </Drawer>
    );
  }

  // Tablet/Desktop: Use side sheet
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        className={cn(
          "p-0 focus:outline-none",
          // Narrower on tablet, full width on desktop
          isTablet ? SHEET_WIDTH_TABLET : SHEET_WIDTH_DESKTOP
        )}
        side="right"
        aria-describedby="sheet-description"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Jobs in {location.displayName}</SheetTitle>
          <SheetDescription id="sheet-description">
            View {location.jobCount} job opportunities in this location
          </SheetDescription>
        </SheetHeader>
        
        <JobListContent 
          location={location} 
          onClose={onClose}
          isMobile={false}
          isTablet={isTablet}
        />
      </SheetContent>
    </Sheet>
  );
});

export default JobListPanel;
