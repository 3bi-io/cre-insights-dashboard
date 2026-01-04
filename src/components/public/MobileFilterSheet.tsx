/**
 * Mobile Filter Sheet Component
 * Bottom sheet pattern for mobile job filters with active filter badges
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { SlidersHorizontal, Search, X } from 'lucide-react';

interface FilterOption {
  id: string;
  name: string;
}

interface MobileFilterSheetProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  locationFilter: string;
  setLocationFilter: (value: string) => void;
  clientFilter: string;
  setClientFilter: (value: string) => void;
  sortBy: 'recent' | 'title' | 'salary-high' | 'salary-low';
  setSortBy: (value: 'recent' | 'title' | 'salary-high' | 'salary-low') => void;
  locations: string[];
  clients: FilterOption[];
  totalCount: number;
}

export const MobileFilterSheet: React.FC<MobileFilterSheetProps> = ({
  searchTerm,
  setSearchTerm,
  locationFilter,
  setLocationFilter,
  clientFilter,
  setClientFilter,
  sortBy,
  setSortBy,
  locations,
  clients,
  totalCount,
}) => {
  // Count active filters (excluding search)
  const activeFilterCount = [
    locationFilter,
    clientFilter,
    sortBy !== 'recent' ? sortBy : '',
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearchTerm('');
    setLocationFilter('');
    setClientFilter('');
    setSortBy('recent');
  };

  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || '';

  return (
    <div className="lg:hidden">
      {/* Sticky Search Bar */}
      <div className="sticky top-[60px] z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b pb-3 pt-1 -mx-4 px-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 relative">
                <SlidersHorizontal className="h-5 w-5" />
                {activeFilterCount > 0 && (
                  <Badge 
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                    variant="default"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-xl">
              <SheetHeader className="pb-4 border-b">
                <div className="flex items-center justify-between">
                  <SheetTitle>Filter Jobs</SheetTitle>
                  {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                      Clear all
                    </Button>
                  )}
                </div>
              </SheetHeader>
              
              <div className="py-6 space-y-6 overflow-y-auto max-h-[calc(85vh-140px)]">
                {/* Company Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company</label>
                  <Select 
                    value={clientFilter || "all"} 
                    onValueChange={(val) => setClientFilter(val === "all" ? "" : val)}
                  >
                    <SelectTrigger className="w-full h-12">
                      <SelectValue placeholder="All Companies" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border shadow-md z-50">
                      <SelectItem value="all">All Companies</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Location Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <Select 
                    value={locationFilter || "all"} 
                    onValueChange={(val) => setLocationFilter(val === "all" ? "" : val)}
                  >
                    <SelectTrigger className="w-full h-12">
                      <SelectValue placeholder="All Locations" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border shadow-md z-50">
                      <SelectItem value="all">All Locations</SelectItem>
                      {locations.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sort by</label>
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-full h-12">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border shadow-md z-50">
                      <SelectItem value="recent">Most Recent</SelectItem>
                      <SelectItem value="title">Title (A-Z)</SelectItem>
                      <SelectItem value="salary-high">Salary (High to Low)</SelectItem>
                      <SelectItem value="salary-low">Salary (Low to High)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <SheetFooter className="border-t pt-4 pb-safe">
                <SheetClose asChild>
                  <Button className="w-full h-12 text-base">
                    Show {totalCount} Jobs
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>

        {/* Active Filter Pills */}
        {(activeFilterCount > 0 || searchTerm) && (
          <div className="flex flex-wrap gap-2 mt-3 overflow-x-auto pb-1 -mx-1 px-1">
            {searchTerm && (
              <Badge variant="secondary" className="gap-1 shrink-0">
                "{searchTerm}"
                <button onClick={() => setSearchTerm('')} className="ml-1">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {clientFilter && (
              <Badge variant="secondary" className="gap-1 shrink-0">
                {getClientName(clientFilter)}
                <button onClick={() => setClientFilter('')} className="ml-1">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {locationFilter && (
              <Badge variant="secondary" className="gap-1 shrink-0">
                {locationFilter}
                <button onClick={() => setLocationFilter('')} className="ml-1">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {sortBy !== 'recent' && (
              <Badge variant="secondary" className="gap-1 shrink-0">
                {sortBy === 'title' ? 'A-Z' : sortBy === 'salary-high' ? 'Salary ↓' : 'Salary ↑'}
                <button onClick={() => setSortBy('recent')} className="ml-1">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileFilterSheet;
