/**
 * Enhanced Job List Panel Component
 * Responsive panel for displaying job details with improved mobile UX and accessibility
 */

import { memo, useRef, useEffect, useCallback } from 'react';
import { X, MapPin, Building2, ExternalLink, ChevronUp, GripHorizontal } from 'lucide-react';
import { MapLocation } from '@/hooks/useJobMapData';
import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface JobListPanelProps {
  location: MapLocation | null;
  onClose: () => void;
}

function formatSalary(min?: number, max?: number, type?: string): string | null {
  if (!min && !max) return null;
  
  const formatNum = (n: number) => {
    if (n >= 1000) {
      return `$${(n / 1000).toFixed(0)}k`;
    }
    return `$${n}`;
  };

  const suffix = type === 'hourly' ? '/hr' : '/yr';
  
  if (min && max) {
    return `${formatNum(min)} - ${formatNum(max)}${suffix}`;
  }
  return `${formatNum(min || max!)}${suffix}`;
}

const JobListContent = memo(function JobListContent({ 
  location, 
  onClose,
  isMobile
}: { 
  location: MapLocation; 
  onClose: () => void;
  isMobile: boolean;
}) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const firstJobRef = useRef<HTMLDivElement>(null);

  // Focus first job card when panel opens for keyboard users
  useEffect(() => {
    const timer = setTimeout(() => {
      firstJobRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Handle keyboard navigation within job list
  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    const jobs = location.jobs;
    
    if (e.key === 'ArrowDown' && index < jobs.length - 1) {
      e.preventDefault();
      const nextCard = document.querySelector(`[data-job-index="${index + 1}"]`) as HTMLElement;
      nextCard?.focus();
    } else if (e.key === 'ArrowUp' && index > 0) {
      e.preventDefault();
      const prevCard = document.querySelector(`[data-job-index="${index - 1}"]`) as HTMLElement;
      prevCard?.focus();
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [location.jobs, onClose]);

  return (
    <div 
      className="flex flex-col h-full"
      role="region"
      aria-label={`Jobs in ${location.displayName}`}
    >
      {/* Mobile Drag Handle */}
      {isMobile && (
        <div className="flex justify-center py-2" aria-hidden="true">
          <GripHorizontal className="w-8 h-1 text-muted-foreground/50" />
        </div>
      )}

      {/* Header */}
      <header className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 
              className="text-lg font-semibold flex items-center gap-2 truncate"
              id="job-panel-title"
            >
              <MapPin className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
              {location.displayName}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {location.jobCount} {location.jobCount === 1 ? 'job' : 'jobs'} available
            </p>
          </div>
          {!location.isExact && (
            <Badge variant="secondary" className="shrink-0">
              Regional
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-4 mt-4 text-sm">
          {location.companies.length > 0 && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Building2 className="w-4 h-4" aria-hidden="true" />
              <span>{location.companies.length} {location.companies.length === 1 ? 'company' : 'companies'}</span>
            </div>
          )}
        </div>

        {/* Top Categories */}
        {location.topCategories.length > 0 && (
          <div 
            className="flex flex-wrap gap-1.5 mt-3"
            role="list"
            aria-label="Job categories"
          >
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
      </header>

      {/* Job List */}
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div 
          className="p-4 space-y-3"
          role="list"
          aria-label="Job listings"
        >
          {location.jobs.map((job, index) => {
            const salary = formatSalary(job.salary_min, job.salary_max, job.salary_type);
            const companyName = job.clients?.name || job.organizations?.name;

            return (
              <div
                key={job.id}
                ref={index === 0 ? firstJobRef : undefined}
                data-job-index={index}
                tabIndex={0}
                role="listitem"
                className="group p-4 rounded-lg border border-border bg-card hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-ring focus:outline-none hover:shadow-sm transition-all cursor-pointer"
                onKeyDown={(e) => handleKeyDown(e, index)}
                aria-label={`${job.title || job.job_title} at ${companyName || 'Company'}${salary ? `, ${salary}` : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-base group-hover:text-primary group-focus:text-primary transition-colors truncate">
                      {job.title || job.job_title}
                    </h3>
                    {companyName && (
                      <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
                        {companyName}
                      </p>
                    )}
                  </div>
                  {salary && (
                    <Badge variant="secondary" className="shrink-0">
                      {salary}
                    </Badge>
                  )}
                </div>

                {job.job_summary && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {job.job_summary}
                  </p>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                  <span className="text-xs text-muted-foreground">
                    {job.created_at && formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                  </span>
                  <Link 
                    to={`/jobs/${job.id}`}
                    className="text-xs font-medium text-primary hover:underline focus:underline flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`View details for ${job.title || job.job_title}`}
                  >
                    View Details
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <footer className="p-4 border-t border-border bg-background">
        <Button
          variant="outline"
          className="w-full"
          onClick={onClose}
          aria-label="Close job list panel"
        >
          Close
        </Button>
      </footer>
    </div>
  );
});

export const JobListPanel = memo(function JobListPanel({
  location,
  onClose,
}: JobListPanelProps) {
  const isMobile = useIsMobile();

  if (!location) return null;

  // Use Drawer on mobile, Sheet on desktop
  if (isMobile) {
    return (
      <Drawer 
        open={!!location} 
        onOpenChange={(open) => !open && onClose()}
        snapPoints={[0.5, 0.9]}
        fadeFromIndex={1}
      >
        <DrawerContent 
          className="max-h-[90vh] focus:outline-none"
          aria-labelledby="job-panel-title"
        >
          <DrawerHeader className="sr-only">
            <DrawerTitle>{location.displayName} Jobs</DrawerTitle>
          </DrawerHeader>
          <JobListContent location={location} onClose={onClose} isMobile={true} />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={!!location} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        className="w-[400px] sm:w-[450px] p-0 focus:outline-none"
        aria-labelledby="job-panel-title"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{location.displayName} Jobs</SheetTitle>
        </SheetHeader>
        <SheetClose 
          className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Close"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </SheetClose>
        <JobListContent location={location} onClose={onClose} isMobile={false} />
      </SheetContent>
    </Sheet>
  );
});

export default JobListPanel;
