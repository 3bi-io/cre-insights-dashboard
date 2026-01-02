/**
 * MobileFilterSheet Component
 * Collapsible filter panel that opens as a bottom sheet on mobile
 */

import * as React from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MobileFilterSheetProps {
  children: React.ReactNode;
  activeFilterCount?: number;
  onClearFilters?: () => void;
  title?: string;
  triggerClassName?: string;
}

export function MobileFilterSheet({
  children,
  activeFilterCount = 0,
  onClearFilters,
  title = "Filters",
  triggerClassName,
}: MobileFilterSheetProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("relative gap-2", triggerClassName)}
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-xl">
        <SheetHeader className="flex-row items-center justify-between pb-4">
          <SheetTitle>{title}</SheetTitle>
          {activeFilterCount > 0 && onClearFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-muted-foreground"
            >
              <X className="mr-1 h-4 w-4" />
              Clear all
            </Button>
          )}
        </SheetHeader>
        <ScrollArea className="h-[calc(85vh-8rem)] pr-4">
          <div className="space-y-6 pb-4">{children}</div>
        </ScrollArea>
        <SheetFooter className="pt-4">
          <SheetClose asChild>
            <Button className="w-full" size="lg">
              Apply Filters
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/**
 * FilterSection Component
 * Groups related filters with a label
 */
interface FilterSectionProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export function FilterSection({ label, children, className }: FilterSectionProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}
