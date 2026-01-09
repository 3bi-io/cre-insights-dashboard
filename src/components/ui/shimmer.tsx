/**
 * Shimmer Loading Animation Component
 * Provides polished loading states with animated shimmer effect
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface ShimmerProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

export const Shimmer: React.FC<ShimmerProps> = ({
  className,
  width,
  height,
  rounded = 'md',
}) => {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-muted',
        roundedClasses[rounded],
        className
      )}
      style={{ width, height }}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
};

// Preset shimmer components for common use cases
export const ShimmerText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 1,
  className,
}) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Shimmer
        key={i}
        className="h-4"
        width={i === lines - 1 ? '75%' : '100%'}
        rounded="sm"
      />
    ))}
  </div>
);

export const ShimmerButton: React.FC<{ className?: string }> = ({ className }) => (
  <Shimmer className={cn('h-10 w-24', className)} rounded="md" />
);

export const ShimmerAvatar: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className,
}) => {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  return <Shimmer className={cn(sizes[size], className)} rounded="full" />;
};

export const ShimmerCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('p-4 space-y-4 border rounded-lg bg-card', className)}>
    <div className="flex items-center gap-3">
      <ShimmerAvatar />
      <div className="flex-1 space-y-2">
        <Shimmer className="h-4 w-1/3" rounded="sm" />
        <Shimmer className="h-3 w-1/2" rounded="sm" />
      </div>
    </div>
    <ShimmerText lines={3} />
    <div className="flex gap-2">
      <ShimmerButton />
      <ShimmerButton className="w-20" />
    </div>
  </div>
);

export const ShimmerJobCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('p-4 sm:p-6 space-y-4 border rounded-xl bg-card', className)}>
    <div className="flex items-start gap-4">
      <Shimmer className="h-12 w-12 sm:h-14 sm:w-14 shrink-0" rounded="lg" />
      <div className="flex-1 space-y-2">
        <Shimmer className="h-5 w-2/3" rounded="sm" />
        <Shimmer className="h-4 w-1/2" rounded="sm" />
      </div>
    </div>
    <div className="flex flex-wrap gap-2">
      <Shimmer className="h-6 w-16" rounded="full" />
      <Shimmer className="h-6 w-20" rounded="full" />
      <Shimmer className="h-6 w-24" rounded="full" />
    </div>
    <ShimmerText lines={2} />
    <div className="flex justify-between items-center pt-2">
      <Shimmer className="h-5 w-24" rounded="sm" />
      <ShimmerButton />
    </div>
  </div>
);

export const ShimmerFormSection: React.FC<{ fields?: number; className?: string }> = ({
  fields = 3,
  className,
}) => (
  <div className={cn('space-y-6', className)}>
    <Shimmer className="h-6 w-40" rounded="sm" />
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Shimmer className="h-4 w-24" rounded="sm" />
          <Shimmer className="h-10 w-full" rounded="md" />
        </div>
      ))}
    </div>
  </div>
);

export default Shimmer;
