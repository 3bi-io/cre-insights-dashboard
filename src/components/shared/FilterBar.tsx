/**
 * Reusable filter bar with tabs + search for public pages
 * Used by BlogPage, ResourcesPage, ClientsPage
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export interface FilterTab {
  id: string;
  label: string;
  icon?: React.ElementType;
}

interface FilterBarProps {
  tabs: FilterTab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  /** Optional count to display after tabs */
  resultCount?: number;
  resultLabel?: string;
}

export const FilterBar = ({
  tabs,
  activeTab,
  onTabChange,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  resultCount,
  resultLabel = 'results',
}: FilterBarProps) => {
  return (
    <section className="border-b bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 items-center">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => onTabChange(tab.id)}
                className="min-h-[44px] whitespace-nowrap gap-1.5 touch-action-manipulation"
              >
                {tab.icon && <tab.icon className="h-3.5 w-3.5" />}
                {tab.label}
              </Button>
            ))}
            {resultCount !== undefined && (
              <span className="text-sm text-muted-foreground whitespace-nowrap ml-2">
                {resultCount} {resultLabel}
              </span>
            )}
          </div>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
