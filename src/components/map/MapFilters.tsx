import { memo, useState } from 'react';
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
import { useIsMobile } from '@/hooks/use-mobile';
import { JobMapFilters } from '@/hooks/useJobMapData';

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
  const isMobile = useIsMobile();
  const [searchValue, setSearchValue] = useState(filters.searchTerm || '');

  const activeFilterCount = [
    filters.clientFilter,
    filters.categoryFilter,
  ].filter(Boolean).length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ ...filters, searchTerm: searchValue });
  };

  const clearFilters = () => {
    setSearchValue('');
    onFiltersChange({});
  };

  const hasAnyFilter = searchValue || filters.clientFilter || filters.categoryFilter;

  return (
    <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-wrap gap-2 items-start">
      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px] max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search jobs..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9 pr-9 bg-background/95 backdrop-blur-sm shadow-lg border-border/50"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => {
                setSearchValue('');
                onFiltersChange({ ...filters, searchTerm: '' });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* Filter Controls */}
      {isMobile ? (
        // Mobile: Popover with all filters
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="bg-background/95 backdrop-blur-sm shadow-lg relative"
            >
              <Filter className="w-4 h-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4" align="end">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Filters</h4>
              
              {/* Company Filter */}
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  Company
                </label>
                <Select
                  value={filters.clientFilter || 'all'}
                  onValueChange={(value) => 
                    onFiltersChange({ ...filters, clientFilter: value === 'all' ? '' : value })
                  }
                >
                  <SelectTrigger>
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
                <label className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  Category
                </label>
                <Select
                  value={filters.categoryFilter || 'all'}
                  onValueChange={(value) => 
                    onFiltersChange({ ...filters, categoryFilter: value === 'all' ? '' : value })
                  }
                >
                  <SelectTrigger>
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
                  className="w-full"
                >
                  <X className="w-3.5 h-3.5 mr-1.5" />
                  Clear all filters
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      ) : (
        // Desktop: Inline dropdowns
        <>
          <Select
            value={filters.clientFilter || 'all'}
            onValueChange={(value) => 
              onFiltersChange({ ...filters, clientFilter: value === 'all' ? '' : value })
            }
          >
            <SelectTrigger className="w-[180px] bg-background/95 backdrop-blur-sm shadow-lg">
              <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
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

          <Select
            value={filters.categoryFilter || 'all'}
            onValueChange={(value) => 
              onFiltersChange({ ...filters, categoryFilter: value === 'all' ? '' : value })
            }
          >
            <SelectTrigger className="w-[160px] bg-background/95 backdrop-blur-sm shadow-lg">
              <Tag className="w-4 h-4 mr-2 text-muted-foreground" />
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

          {hasAnyFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="bg-background/95 backdrop-blur-sm shadow-lg"
            >
              <X className="w-3.5 h-3.5 mr-1.5" />
              Clear
            </Button>
          )}
        </>
      )}
    </div>
  );
});
