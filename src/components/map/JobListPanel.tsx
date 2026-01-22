import { memo } from 'react';
import { X, MapPin, Building2, ExternalLink } from 'lucide-react';
import { MapLocation } from '@/hooks/useJobMapData';
import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
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
  onClose 
}: { 
  location: MapLocation; 
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold flex items-center gap-2 truncate">
              <MapPin className="w-5 h-5 text-primary shrink-0" />
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
              <Building2 className="w-4 h-4" />
              <span>{location.companies.length} {location.companies.length === 1 ? 'company' : 'companies'}</span>
            </div>
          )}
        </div>

        {/* Top Categories */}
        {location.topCategories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {location.topCategories.map((category) => (
              <Badge key={category} variant="outline" className="text-xs">
                {category}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Job List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {location.jobs.map((job) => {
            const salary = formatSalary(job.salary_min, job.salary_max, job.salary_type);
            const companyName = job.clients?.name || job.organizations?.name;

            return (
              <div
                key={job.id}
                className="group p-4 rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-base group-hover:text-primary transition-colors truncate">
                      {job.title || job.job_title}
                    </h3>
                    {companyName && (
                      <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" />
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
                    className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    View Details
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border bg-background">
        <Button
          variant="outline"
          className="w-full"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
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
      <Drawer open={!!location} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="sr-only">
            <DrawerTitle>{location.displayName} Jobs</DrawerTitle>
          </DrawerHeader>
          <JobListContent location={location} onClose={onClose} />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={!!location} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[400px] sm:w-[450px] p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>{location.displayName} Jobs</SheetTitle>
        </SheetHeader>
        <SheetClose className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </SheetClose>
        <JobListContent location={location} onClose={onClose} />
      </SheetContent>
    </Sheet>
  );
});
