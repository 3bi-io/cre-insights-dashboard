import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardSkeletonProps {
  cardCount?: number;
}

export const DashboardSkeleton = React.memo<DashboardSkeletonProps>(({ cardCount = 4 }) => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: cardCount }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
});

DashboardSkeleton.displayName = 'DashboardSkeleton';
