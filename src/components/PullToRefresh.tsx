import React from 'react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { Loader2, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  enabled?: boolean;
  className?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  enabled = true,
  className
}) => {
  const { containerRef, isRefreshing, pullDistance } = usePullToRefresh({
    onRefresh,
    enabled,
    threshold: 80
  });

  const showRefreshIndicator = pullDistance > 0 || isRefreshing;
  const indicatorOpacity = Math.min(pullDistance / 80, 1);
  const rotation = pullDistance * 2;

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-auto', className)}
      style={{ 
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'none'
      }}
    >
      {/* Refresh Indicator */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 z-50 flex items-center justify-center transition-all duration-200',
          showRefreshIndicator ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        style={{
          transform: `translateY(${isRefreshing ? '60px' : `${pullDistance}px`})`,
          opacity: indicatorOpacity
        }}
      >
        <div className="bg-card border border-border rounded-full p-3 shadow-lg">
          {isRefreshing ? (
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          ) : (
            <ArrowDown
              className="w-6 h-6 text-primary transition-transform"
              style={{ transform: `rotate(${rotation}deg)` }}
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${isRefreshing ? '60px' : `${pullDistance * 0.5}px`})`,
          transition: isRefreshing || pullDistance === 0 ? 'transform 0.3s ease-out' : 'none'
        }}
      >
        {children}
      </div>
    </div>
  );
};
