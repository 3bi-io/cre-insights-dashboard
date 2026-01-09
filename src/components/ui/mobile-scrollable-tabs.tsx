/**
 * MobileScrollableTabs
 * A wrapper component that makes TabsList horizontally scrollable on mobile
 * while maintaining grid layout on larger screens.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface MobileScrollableTabsListProps {
  children: React.ReactNode;
  className?: string;
  /** Number of columns for desktop grid layout */
  columns?: number;
}

/**
 * Wrapper for TabsList that enables horizontal scrolling on mobile
 * and grid layout on desktop (md breakpoint and above)
 */
export function MobileScrollableTabsList({
  children,
  className,
  columns = 6,
}: MobileScrollableTabsListProps) {
  return (
    <div className="w-full -mx-4 px-4 md:mx-0 md:px-0">
      <ScrollArea className="w-full whitespace-nowrap md:whitespace-normal">
        <div
          className={cn(
            // Mobile: horizontal flex with touch-friendly sizing
            "inline-flex h-auto items-center gap-1 rounded-md bg-muted p-1 text-muted-foreground min-w-full",
            // Desktop: grid layout
            `md:grid md:grid-cols-${columns}`,
            className
          )}
        >
          {children}
        </div>
        <ScrollBar orientation="horizontal" className="md:hidden" />
      </ScrollArea>
    </div>
  );
}

interface MobileTabsTriggerWrapperProps {
  children: React.ReactNode;
  className?: string;
  /** Show label on mobile or just icon */
  showLabelOnMobile?: boolean;
}

/**
 * Wrapper for individual TabsTrigger to optimize for mobile
 */
export function MobileTabsTriggerContent({
  icon,
  label,
  showLabelOnMobile = false,
}: {
  icon?: React.ReactNode;
  label: string;
  showLabelOnMobile?: boolean;
}) {
  return (
    <>
      {icon}
      <span className={cn(showLabelOnMobile ? "" : "hidden sm:inline", "whitespace-nowrap")}>
        {label}
      </span>
    </>
  );
}
