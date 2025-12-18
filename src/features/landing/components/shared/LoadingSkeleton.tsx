/**
 * Loading Skeleton Component
 * Provides placeholder UI during lazy loading
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  variant?: 'section' | 'card' | 'stats';
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  variant = 'section',
  className 
}) => {
  if (variant === 'stats') {
    return (
      <div className={cn("py-12 md:py-16 bg-muted/30", className)}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center space-y-2">
                <div className="h-10 w-24 mx-auto bg-muted rounded animate-pulse" />
                <div className="h-4 w-32 mx-auto bg-muted/60 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn("p-6 rounded-lg border bg-card", className)}>
        <div className="h-12 w-12 bg-muted rounded-lg animate-pulse mb-4" />
        <div className="h-6 w-3/4 bg-muted rounded animate-pulse mb-2" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-muted/60 rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-muted/60 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("py-12 md:py-20", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="h-8 w-64 mx-auto bg-muted rounded animate-pulse mb-4" />
          <div className="h-4 w-96 max-w-full mx-auto bg-muted/60 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-6 rounded-lg border bg-card">
              <div className="h-12 w-12 bg-muted rounded-lg animate-pulse mb-4" />
              <div className="h-6 w-3/4 bg-muted rounded animate-pulse mb-2" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-muted/60 rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-muted/60 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
