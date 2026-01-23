/**
 * Enhanced Map Filters Component
 * Responsive filter controls with tablet-specific layouts and improved accessibility
 */

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, Filter, Building2, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/ui/badge';
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
import { JobMapFilters } from '@/hooks/useJobMapData';
import { useDebouncedCallback } from '@/utils/performance';
import { useMapContextOptional } from './MapContext';
import { SEARCH_DEBOUNCE_MS } from './constants';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface MapFiltersProps {
  filters: JobMapFilters;
  onFiltersChange: (filters: JobMapFilters) => void;
  companies: { id: string; name: string }[];
  categories: string[];
}

export const MapFilters = memo(function MapFilters({
  filters,
  onFiltersChange,
  companies,
  categories,
}: MapFiltersProps) {
  const mapContext = useMapContextOptional();
  const isMobileFallback = useIsMobile();
  
  const isMobile = mapContext?.isMobile ?? isMobileFallback;
  const isTablet = mapContext?.isTablet ?? false;
  
  const [searchValue, setSearchValue] = useState(filters.searchTerm || '');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounced search to reduce API calls
  const debouncedSearch = useDebouncedCallback((value: string) => {
    onFiltersChange({ ...filters, searchTerm: value });
  }, SEARCH_DEBOUNCE_MS);

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  const activeFilterCount = [
    filters.clientFilter,
    filters.categoryFilter,
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

  const hasAnyFilter = searchValue || filters.clientFilter || filters.categoryFilter;

  // Announce filter changes to screen readers
  const [announcement, setAnnouncement] = useState('');
  
  useEffect(() => {
    if (activeFilterCount > 0) {
      setAnnouncement(`${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} applied`);
    } else {
      setAnnouncement('');
    }
  }, [activeFilterCount]);

  // Use popover for mobile, inline for tablet and desktop
  const usePopover = isMobile;

  return (
    <>
      {/* Screen reader announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <div 
        className={cn(
          "absolute z-[1000] flex flex-wrap gap-2 items-start",
          // Position below header on all devices
          "top-20 left-4 right-4",
          // On tablet+, give more room for controls on right
          "lg:right-auto lg:max-w-2xl"
        )}
        role="search"
        aria-label="Filter jobs on map"
      >
        {/* Search Input */}
        <form 
          onSubmit={handleSearchSubmit} 
          className={cn(
            "flex-1 min-w-[200px]",
            // Full width on mobile, constrained on larger screens
            isMobile ? "w-full" : "max-w-md"
          )}
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
                "pl-9 pr-9 bg-background/95 backdrop-blur-sm shadow-lg border-border/50",
                // Taller on touch devices
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
                  // Larger touch target on mobile
                  isMobile && "p-1 -mr-1"
                )}
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        {/* Filter Controls */}
        {usePopover ? (
          // Mobile: Popover with all filters
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "bg-background/95 backdrop-blur-sm shadow-lg relative",
                  // Larger touch target on mobile
                  "h-12 w-12"
                )}
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
            <PopoverContent 
              className="w-72 p-4" 
              align="end"
              role="dialog"
              aria-label="Filter options"
            >
              <div className="space-y-4">
                <h4 className="font-medium text-sm" id="filter-heading">Filters</h4>
                
                {/* Company Filter */}
                <div className="space-y-2">
                  <label 
                    htmlFor="mobile-company-filter"
                    className="text-sm text-muted-foreground flex items-center gap-1.5"
                  >
                    <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
                    Company
                  </label>
                  <Select
                    value={filters.clientFilter || 'all'}
                    onValueChange={(value) => 
                      onFiltersChange({ ...filters, clientFilter: value === 'all' ? '' : value })
                    }
                  >
                    <SelectTrigger id="mobile-company-filter" className="h-11">
                      <SelectValue placeholder="All companies" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All companies</SelectItem>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Category Filter */}
                <div className="space-y-2">
                  <label 
                    htmlFor="mobile-category-filter"
                    className="text-sm text-muted-foreground flex items-center gap-1.5"
                  >
                    <Tag className="w-3.5 h-3.5" aria-hidden="true" />
                    Category
                  </label>
                  <Select
                    value={filters.categoryFilter || 'all'}
                    onValueChange={(value) => 
                      onFiltersChange({ ...filters, categoryFilter: value === 'all' ? '' : value })
                    }
                  >
                    <SelectTrigger id="mobile-category-filter" className="h-11">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {hasAnyFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="w-full h-11"
                  >
                    <X className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                    Clear all filters
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          // Tablet/Desktop: Inline dropdowns
          <>
            <div className="relative">
              <label htmlFor="desktop-company-filter" className="sr-only">
                Filter by company
              </label>
              <Select
                value={filters.clientFilter || 'all'}
                onValueChange={(value) => 
                  onFiltersChange({ ...filters, clientFilter: value === 'all' ? '' : value })
                }
              >
                <SelectTrigger 
                  id="desktop-company-filter"
                  className={cn(
                    "bg-background/95 backdrop-blur-sm shadow-lg",
                    // Narrower on tablet
                    isTablet ? "w-[150px] h-10" : "w-[180px] h-10"
                  )}
                >
                  <Building2 className="w-4 h-4 mr-2 text-muted-foreground" aria-hidden="true" />
                  <SelectValue placeholder="All companies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All companies</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <label htmlFor="desktop-category-filter" className="sr-only">
                Filter by category
              </label>
              <Select
                value={filters.categoryFilter || 'all'}
                onValueChange={(value) => 
                  onFiltersChange({ ...filters, categoryFilter: value === 'all' ? '' : value })
                }
              >
                <SelectTrigger 
                  id="desktop-category-filter"
                  className={cn(
                    "bg-background/95 backdrop-blur-sm shadow-lg",
                    // Narrower on tablet
                    isTablet ? "w-[130px] h-10" : "w-[160px] h-10"
                  )}
                >
                  <Tag className="w-4 h-4 mr-2 text-muted-foreground" aria-hidden="true" />
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasAnyFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="bg-background/95 backdrop-blur-sm shadow-lg h-10"
                aria-label="Clear all filters"
              >
                <X className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                Clear
              </Button>
            )}
          </>
        )}
      </div>
    </>
  );
});

export default MapFilters;
