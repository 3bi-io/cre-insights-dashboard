/**
 * Enhanced Map Filters Component
 * Includes exact-only toggle, display mode selector, sticky positioning on mobile
 */

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, Filter, Building2, Tag, Navigation } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/design-system/Button';
import { Toggle } from '@/components/ui/toggle';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { JobMapFilters } from '@/hooks/useJobMapData';
import { useDebouncedCallback } from '@/utils/performance';
import { useMapContextOptional } from './MapContext';
import { SEARCH_DEBOUNCE_MS, type DisplayMode } from './constants';
import { DisplayModeSelector } from './DisplayModeSelector';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface MapFiltersProps {
  filters: JobMapFilters;
  onFiltersChange: (filters: JobMapFilters) => void;
  companies: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  displayMode?: DisplayMode;
  onDisplayModeChange?: (mode: DisplayMode) => void;
}

export const MapFilters = memo(function MapFilters({
  filters,
  onFiltersChange,
  companies,
  categories,
  displayMode = 'standard',
  onDisplayModeChange,
}: MapFiltersProps) {
  const mapContext = useMapContextOptional();
  const isMobileFallback = useIsMobile();
  const isMobile = mapContext?.isMobile ?? isMobileFallback;
  const isTablet = mapContext?.isTablet ?? false;
  
  const [searchValue, setSearchValue] = useState(filters.searchTerm || '');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const debouncedSearch = useDebouncedCallback((value: string) => {
    onFiltersChange({ ...filters, searchTerm: value });
  }, SEARCH_DEBOUNCE_MS);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  const activeFilterCount = [
    filters.clientFilter,
    filters.categoryFilter,
    filters.exactOnly ? 'exact' : undefined,
  ].filter(Boolean).length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ ...filters, searchTerm: searchValue });
  };

  const clearFilters = useCallback(() => {
    setSearchValue('');
    onFiltersChange({});
    searchInputRef.current?.focus();
  }, [onFiltersChange]);

  const hasAnyFilter = searchValue || filters.clientFilter || filters.categoryFilter || filters.exactOnly;

  const [announcement, setAnnouncement] = useState('');
  useEffect(() => {
    if (activeFilterCount > 0) {
      setAnnouncement(`${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} applied`);
    } else {
      setAnnouncement('');
    }
  }, [activeFilterCount]);

  const usePopover = isMobile;

  const exactOnlyToggle = (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Toggle
            pressed={!!filters.exactOnly}
            onPressedChange={(pressed) => onFiltersChange({ ...filters, exactOnly: pressed })}
            className={cn(
              "bg-background/90 backdrop-blur-md shadow-lg border border-border/50",
              isMobile ? "h-12 w-12" : "h-10 w-10",
              "data-[state=on]:bg-emerald-500/20 data-[state=on]:text-emerald-700 dark:data-[state=on]:text-emerald-400",
              "data-[state=on]:border-emerald-500/40"
            )}
            aria-label={filters.exactOnly ? 'Show all locations' : 'Only exact locations'}
          >
            <Navigation className={isMobile ? "w-5 h-5" : "w-4 h-4"} />
          </Toggle>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={8}>
          <p>{filters.exactOnly ? 'Showing exact locations only' : 'Show only exact locations'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <>
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <div 
        className={cn(
          "absolute z-[1000] flex flex-wrap gap-2 items-start",
          isMobile ? "top-3 left-3 right-14" : "top-3 left-3 right-auto max-w-3xl",
        )}
        role="search"
        aria-label="Filter jobs on map"
      >
        {/* Search Input */}
        <form 
          onSubmit={handleSearchSubmit} 
          className={cn("flex-1 min-w-[200px]", isMobile ? "w-full" : "max-w-sm")}
        >
          <div className="relative">
            <Search 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" 
              aria-hidden="true"
            />
            <Input
              ref={searchInputRef}
              type="search"
              placeholder="Search jobs..."
              value={searchValue}
              onChange={handleSearchChange}
              className={cn(
                "pl-9 pr-9 bg-background/90 backdrop-blur-md shadow-lg border-border/50",
                isMobile ? "h-12" : "h-10"
              )}
              aria-label="Search jobs by title, company, or location"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => {
                  setSearchValue('');
                  onFiltersChange({ ...filters, searchTerm: '' });
                  searchInputRef.current?.focus();
                }}
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground",
                  "hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring rounded",
                  isMobile && "p-1 -mr-1"
                )}
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        {/* Exact Only Toggle */}
        {exactOnlyToggle}

        {/* Filter Controls */}
        {usePopover ? (
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn("bg-background/90 backdrop-blur-md shadow-lg border-border/50 relative", "h-12 w-12")}
                aria-label={`Filters${activeFilterCount > 0 ? `, ${activeFilterCount} active` : ''}`}
                aria-expanded={isFilterOpen}
                aria-haspopup="dialog"
              >
                <Filter className="w-5 h-5" />
                {activeFilterCount > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center"
                    aria-hidden="true"
                  >
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-4" align="end" role="dialog" aria-label="Filter options">
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Filters</h4>
                
                <div className="space-y-2">
                  <label htmlFor="mobile-company-filter" className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
                    Company
                  </label>
                  <Select
                    value={filters.clientFilter || 'all'}
                    onValueChange={(value) => onFiltersChange({ ...filters, clientFilter: value === 'all' ? '' : value })}
                  >
                    <SelectTrigger id="mobile-company-filter" className="h-11">
                      <SelectValue placeholder="All companies" />
                    </SelectTrigger>
                    <SelectContent className="z-[1001]">
                      <SelectItem value="all">All companies</SelectItem>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="mobile-category-filter" className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" aria-hidden="true" />
                    Category
                  </label>
                  <Select
                    value={filters.categoryFilter || 'all'}
                    onValueChange={(value) => onFiltersChange({ ...filters, categoryFilter: value === 'all' ? '' : value })}
                  >
                    <SelectTrigger id="mobile-category-filter" className="h-11">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent className="z-[1001]">
                      <SelectItem value="all">All categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {hasAnyFilter && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full h-11">
                    <X className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                    Clear all filters
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <>
            <div className="relative">
              <label htmlFor="desktop-company-filter" className="sr-only">Filter by company</label>
              <Select
                value={filters.clientFilter || 'all'}
                onValueChange={(value) => onFiltersChange({ ...filters, clientFilter: value === 'all' ? '' : value })}
              >
                <SelectTrigger 
                  id="desktop-company-filter"
                  className={cn("bg-background/90 backdrop-blur-md shadow-lg border-border/50", isTablet ? "w-[150px] h-10" : "w-[170px] h-10")}
                >
                  <Building2 className="w-4 h-4 mr-2 text-muted-foreground" aria-hidden="true" />
                  <SelectValue placeholder="All companies" />
                </SelectTrigger>
                <SelectContent className="z-[1001]">
                  <SelectItem value="all">All companies</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <label htmlFor="desktop-category-filter" className="sr-only">Filter by category</label>
              <Select
                value={filters.categoryFilter || 'all'}
                onValueChange={(value) => onFiltersChange({ ...filters, categoryFilter: value === 'all' ? '' : value })}
              >
                <SelectTrigger 
                  id="desktop-category-filter"
                  className={cn("bg-background/90 backdrop-blur-md shadow-lg border-border/50", isTablet ? "w-[130px] h-10" : "w-[160px] h-10")}
                >
                  <Tag className="w-4 h-4 mr-2 text-muted-foreground" aria-hidden="true" />
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent className="z-[1001]">
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasAnyFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="bg-background/90 backdrop-blur-md shadow-lg border border-border/50 h-10"
                aria-label="Clear all filters"
              >
                <X className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                Clear
              </Button>
            )}
          </>
        )}

        {/* Display Mode — desktop inline, mobile below search */}
        {onDisplayModeChange && (
          <div className={cn(isMobile && "w-full")}>
            <DisplayModeSelector
              mode={displayMode}
              onModeChange={onDisplayModeChange}
              compact={isMobile || isTablet}
              className={cn(
                isMobile && "w-full justify-center"
              )}
            />
          </div>
        )}
      </div>
    </>
  );
});

export default MapFilters;
