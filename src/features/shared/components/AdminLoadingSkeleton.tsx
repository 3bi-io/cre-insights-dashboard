import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface AdminLoadingSkeletonProps {
  variant?: 'default' | 'table' | 'cards' | 'form' | 'dashboard';
  className?: string;
}

/**
 * Reusable loading skeleton for admin pages with different layout variants
 */
const AdminLoadingSkeleton: React.FC<AdminLoadingSkeletonProps> = ({ 
  variant = 'default',
  className 
}) => {
  switch (variant) {
    case 'dashboard':
      return (
        <div className={cn("space-y-6", className)}>
          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card rounded-lg border p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
          
          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-card rounded-lg border p-4">
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-[200px] w-full" />
              </div>
            ))}
          </div>
          
          {/* Table */}
          <TableSkeleton />
        </div>
      );

    case 'table':
      return <TableSkeleton className={className} />;

    case 'cards':
      return (
        <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          ))}
        </div>
      );

    case 'form':
      return (
        <div className={cn("bg-card rounded-lg border p-6 space-y-6 max-w-2xl", className)}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <div className="flex gap-3 pt-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      );

    default:
      return (
        <div className={cn("space-y-6", className)}>
          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card rounded-lg border p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
          
          {/* Main content area */}
          <TableSkeleton />
        </div>
      );
  }
};

// Reusable table skeleton
const TableSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("bg-card rounded-lg border", className)}>
    <div className="p-4 border-b flex items-center justify-between">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-9 w-24" />
    </div>
    <div className="p-4 space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-8 w-20 shrink-0" />
        </div>
      ))}
    </div>
    <div className="p-4 border-t flex items-center justify-between">
      <Skeleton className="h-4 w-32" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
      </div>
    </div>
  </div>
);

export default AdminLoadingSkeleton;
export { TableSkeleton };
