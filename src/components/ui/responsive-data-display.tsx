/**
 * ResponsiveDataDisplay Component
 * Auto-switches between Table view (desktop) and Card view (mobile)
 */

import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface ResponsiveDataDisplayProps<T> {
  data: T[];
  renderTable: () => React.ReactNode;
  renderCard: (item: T, index: number) => React.ReactNode;
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  className?: string;
  cardContainerClassName?: string;
  loadingSkeletonCount?: number;
}

export function ResponsiveDataDisplay<T>({
  data,
  renderTable,
  renderCard,
  loading = false,
  emptyMessage = "No data found",
  emptyIcon,
  className,
  cardContainerClassName,
  loadingSkeletonCount = 3,
}: ResponsiveDataDisplayProps<T>) {
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        {Array.from({ length: loadingSkeletonCount }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-12 text-center",
          className
        )}
      >
        {emptyIcon && <div className="mb-4 text-muted-foreground">{emptyIcon}</div>}
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className={cn("space-y-3", cardContainerClassName, className)}>
        {data.map((item, index) => (
          <React.Fragment key={index}>{renderCard(item, index)}</React.Fragment>
        ))}
      </div>
    );
  }

  return <div className={className}>{renderTable()}</div>;
}

/**
 * ResponsiveTableWrapper
 * Hides table on mobile, shows on desktop
 */
export function ResponsiveTableWrapper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("hidden md:block", className)}>{children}</div>;
}

/**
 * ResponsiveCardWrapper
 * Shows cards on mobile, hides on desktop
 */
export function ResponsiveCardWrapper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("md:hidden", className)}>{children}</div>;
}
