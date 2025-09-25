import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const ClientsLoading: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <div className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-8 py-6 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-5 w-64" />
            </div>
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Search skeleton */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-20" />
          </div>
          <Skeleton className="h-5 w-32" />
        </div>

        {/* Table skeleton */}
        <div className="bg-card border rounded-lg">
          <div className="p-6 space-y-4">
            {/* Table header */}
            <div className="flex justify-between items-center pb-4 border-b">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-20" />
              ))}
            </div>
            
            {/* Table rows */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between items-center py-4">
                {[...Array(6)].map((_, j) => (
                  <Skeleton key={j} className="h-6 w-20" />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Summary skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </div>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClientsLoading;