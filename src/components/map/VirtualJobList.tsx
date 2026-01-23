/**
 * Virtual Job List Component
 * Efficiently renders large lists of jobs using virtualization
 * Only renders visible items plus overscan buffer
 */

import { memo, useCallback, useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, DollarSign, Clock, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

// Job type from the map data
interface Job {
  id: string;
  title?: string;
  job_title?: string;
  job_summary?: string;
  salary_min?: number;
  salary_max?: number;
  salary_type?: string;
  created_at?: string;
  clients?: { name: string };
  organizations?: { name: string };
}

interface VirtualJobListProps {
  jobs: Job[];
  isMobile: boolean;
  locationName: string;
  onClose: () => void;
}

// Constants for virtualization
const ITEM_HEIGHT_MOBILE = 180; // Larger cards on mobile
const ITEM_HEIGHT_DESKTOP = 160;
const OVERSCAN = 3; // Number of extra items to render above/below viewport
const VIRTUAL_THRESHOLD = 20; // Only virtualize if more than this many jobs

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

// Individual job card component
const JobCard = memo(function JobCard({
  job,
  index,
  style,
  isMobile,
}: {
  job: Job;
  index: number;
  style: React.CSSProperties;
  isMobile: boolean;
}) {
  const salary = formatSalary(job.salary_min, job.salary_max, job.salary_type);
  const companyName = job.clients?.name || job.organizations?.name;

  return (
    <div style={style} className="px-4 py-1.5">
      <article
        data-job-index={index}
        tabIndex={0}
        role="listitem"
        aria-labelledby={`job-title-${job.id}`}
        className={cn(
          "block p-4 rounded-lg border border-border bg-card",
          "transition-all duration-200",
          "hover:border-primary/50 hover:shadow-md",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
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
              "py-1 -my-1"
            )}
          >
            View Details
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
      </article>
    </div>
  );
});

export const VirtualJobList = memo(function VirtualJobList({
  jobs,
  isMobile,
  locationName,
  onClose,
}: VirtualJobListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const itemHeight = isMobile ? ITEM_HEIGHT_MOBILE : ITEM_HEIGHT_DESKTOP;
  const totalHeight = jobs.length * itemHeight;
  
  // Use virtualization only for large lists
  const useVirtualization = jobs.length > VIRTUAL_THRESHOLD;

  // Measure container height
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);
    setContainerHeight(container.clientHeight);

    return () => resizeObserver.disconnect();
  }, []);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - OVERSCAN);
  const endIndex = Math.min(
    jobs.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + OVERSCAN
  );

  // Keyboard navigation
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
    
    if (nextIndex !== null && nextIndex >= 0 && nextIndex < jobs.length) {
      const nextCard = containerRef.current?.querySelector(`[data-job-index="${nextIndex}"]`);
      if (nextCard instanceof HTMLElement) {
        nextCard.focus();
        nextCard.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [jobs.length, onClose]);

  // For small lists, render normally without virtualization
  if (!useVirtualization) {
    return (
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto"
        onKeyDown={handleKeyDown}
        role="list"
        aria-label={`Jobs in ${locationName}`}
      >
        <div className="py-2">
          {jobs.map((job, index) => (
            <JobCard
              key={job.id}
              job={job}
              index={index}
              style={{}}
              isMobile={isMobile}
            />
          ))}
        </div>
      </div>
    );
  }

  // Virtualized rendering for large lists
  const visibleJobs = jobs.slice(startIndex, endIndex + 1);

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto"
      onScroll={handleScroll}
      onKeyDown={handleKeyDown}
      role="list"
      aria-label={`Jobs in ${locationName}`}
    >
      {/* Total height container for proper scrollbar */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleJobs.map((job, i) => {
          const actualIndex = startIndex + i;
          return (
            <JobCard
              key={job.id}
              job={job}
              index={actualIndex}
              style={{
                position: 'absolute',
                top: actualIndex * itemHeight,
                left: 0,
                right: 0,
                height: itemHeight,
              }}
              isMobile={isMobile}
            />
          );
        })}
      </div>
      
      {/* Screen reader announcement for virtualized list */}
      <div className="sr-only" aria-live="polite">
        Showing jobs {startIndex + 1} to {endIndex + 1} of {jobs.length}
      </div>
    </div>
  );
});

export default VirtualJobList;
