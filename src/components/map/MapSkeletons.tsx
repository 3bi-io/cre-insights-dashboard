/**
 * Map Loading States and Skeleton Components
 * Provides visual feedback during data loading with accessible announcements
 */

import { memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface MapSkeletonProps {
  isMobile?: boolean;
}

/**
 * Skeleton loader for the filter bar
 */
export const MapFiltersSkeleton = memo(function MapFiltersSkeleton({ 
  isMobile = false 
}: MapSkeletonProps) {
  return (
    <div 
      className={cn(
        "absolute z-[1000] flex flex-wrap gap-2 items-start",
        "top-20 left-4 right-4",
        "lg:right-auto lg:max-w-2xl"
      )}
      role="status"
      aria-label="Loading filters"
    >
      {/* Search input skeleton */}
      <div className={cn(
        "flex-1 min-w-[200px]",
        isMobile ? "w-full" : "max-w-md"
      )}>
        <Skeleton className={cn(
          "w-full rounded-md",
          isMobile ? "h-12" : "h-10"
        )} />
      </div>

      {isMobile ? (
        // Mobile: Filter button skeleton
        <Skeleton className="h-12 w-12 rounded-md" />
      ) : (
        // Desktop: Inline filter dropdowns
        <>
          <Skeleton className="h-10 w-[180px] rounded-md" />
          <Skeleton className="h-10 w-[160px] rounded-md" />
        </>
      )}
    </div>
  );
});

/**
 * Skeleton loader for the stats display
 */
export const MapStatsSkeleton = memo(function MapStatsSkeleton({ 
  isMobile = false 
}: MapSkeletonProps) {
  return (
    <div 
      className={cn(
        "absolute z-[1000] bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-border",
        isMobile ? "bottom-4 left-4 p-2" : "bottom-4 left-4 p-3"
      )}
      role="status"
      aria-label="Loading statistics"
    >
      {isMobile ? (
        <Skeleton className="h-6 w-24 rounded" />
      ) : (
        <div className="flex items-center gap-4">
          <Skeleton className="h-5 w-20 rounded" />
          <Skeleton className="h-4 w-px" />
          <Skeleton className="h-5 w-24 rounded" />
        </div>
      )}
    </div>
  );
});

/**
 * Skeleton loader for the layer controls
 */
export const MapControlsSkeleton = memo(function MapControlsSkeleton({ 
  isMobile = false 
}: MapSkeletonProps) {
  const buttonSize = isMobile ? "h-11 w-11" : "h-9 w-9";
  
  return (
    <div 
      className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2"
      role="status"
      aria-label="Loading map controls"
    >
      {/* Zoom controls */}
      <div className="flex flex-col bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-border overflow-hidden">
        <Skeleton className={cn(buttonSize, "rounded-none")} />
        <div className="h-px bg-border" />
        <Skeleton className={cn(buttonSize, "rounded-none")} />
      </div>
      
      {/* Layer toggle buttons */}
      <div className="flex flex-col gap-1.5">
        <Skeleton className={cn(buttonSize, "rounded-lg")} />
        <Skeleton className={cn(buttonSize, "rounded-lg")} />
      </div>
    </div>
  );
});

/**
 * Skeleton for the job list panel content
 */
export const JobListPanelSkeleton = memo(function JobListPanelSkeleton() {
  return (
    <div 
      className="flex flex-col h-full p-4 space-y-4"
      role="status"
      aria-label="Loading job list"
    >
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-6 w-48 rounded" />
        </div>
        <Skeleton className="h-4 w-24 rounded" />
      </div>
      
      {/* Company info */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 w-32 rounded" />
      </div>
      
      {/* Categories */}
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      
      {/* Job cards */}
      <div className="space-y-3 pt-4 border-t border-border">
        {[1, 2, 3, 4].map((i) => (
          <JobCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
});

/**
 * Individual job card skeleton
 */
export const JobCardSkeleton = memo(function JobCardSkeleton() {
  return (
    <div className="p-4 rounded-lg border border-border bg-card space-y-3">
      <Skeleton className="h-5 w-3/4 rounded" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 w-32 rounded" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-3 w-16 rounded" />
        <Skeleton className="h-3 w-20 rounded" />
      </div>
      <Skeleton className="h-4 w-full rounded" />
      <div className="pt-3 border-t border-border">
        <Skeleton className="h-4 w-24 rounded" />
      </div>
    </div>
  );
});

/**
 * Full map page loading overlay
 */
export const MapLoadingOverlay = memo(function MapLoadingOverlay({ 
  message = "Loading map data..." 
}: { 
  message?: string 
}) {
  return (
    <div 
      className="absolute inset-0 z-[2000] flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4 p-6 bg-background rounded-xl shadow-xl border border-border">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-muted animate-pulse" />
          <div 
            className="absolute inset-0 w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"
            aria-hidden="true"
          />
        </div>
        <p className="text-sm font-medium text-muted-foreground">{message}</p>
      </div>
    </div>
  );
});

export default {
  MapFiltersSkeleton,
  MapStatsSkeleton,
  MapControlsSkeleton,
  JobListPanelSkeleton,
  JobCardSkeleton,
  MapLoadingOverlay,
};
