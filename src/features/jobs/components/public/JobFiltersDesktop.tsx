import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import type { PublicJobSortOption, PublicClientOption } from '../../types';

interface JobFiltersDesktopProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  locationFilter: string;
  onLocationChange: (value: string) => void;
  clientFilter: string;
  onClientChange: (value: string) => void;
  sortBy: PublicJobSortOption;
  onSortChange: (value: PublicJobSortOption) => void;
  locations: string[];
  clients: PublicClientOption[];
}

/**
 * Desktop filter row for public jobs page
 * Hidden on mobile (lg:block)
 */
export function JobFiltersDesktop({
  searchTerm,
  onSearchChange,
  locationFilter,
  onLocationChange,
  clientFilter,
  onClientChange,
  sortBy,
  onSortChange,
  locations,
  clients
}: JobFiltersDesktopProps) {
  return (
    <div className="hidden lg:block">
      <div className="flex flex-col gap-4 mb-6">
        {/* Search and Company Filter Row */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              id="job-search"
              name="job-search"
              placeholder="Search jobs by title, company, or keywords..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select 
            name="company-filter" 
            value={clientFilter || "all"} 
            onValueChange={(val) => onClientChange(val === "all" ? "" : val)}
          >
            <SelectTrigger className="w-56">
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

        {/* Location and Sort Row */}
        <div className="flex gap-4">
          <Select 
            name="location-filter" 
            value={locationFilter || "all"} 
            onValueChange={(val) => onLocationChange(val === "all" ? "" : val)}
          >
            <SelectTrigger className="w-48">
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

          <Select 
            name="sort-by" 
            value={sortBy} 
            onValueChange={(value) => onSortChange(value as PublicJobSortOption)}
          >
            <SelectTrigger className="w-48">
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
    </div>
  );
}
