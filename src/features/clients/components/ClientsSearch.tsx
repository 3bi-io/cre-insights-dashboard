import React, { useState, useMemo } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ClientFilters } from '../types/client.types';

interface ClientsSearchProps {
  clientsCount: number;
  onFiltersChange: (filters: ClientFilters) => void;
  filters: ClientFilters;
}

const ClientsSearch: React.FC<ClientsSearchProps> = ({
  clientsCount,
  onFiltersChange,
  filters
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value || undefined });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({ ...filters, status: value === 'all' ? undefined : value });
  };

  const handleLocationChange = (value: string) => {
    onFiltersChange({ ...filters, location: value || undefined });
  };

  const clearFilters = () => {
    onFiltersChange({});
    setShowFilters(false);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status) count++;
    if (filters.location) count++;
    return count;
  }, [filters]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 flex-1 min-w-[200px] max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Search clients..." 
              className="pl-10" 
              value={filters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1">{activeFiltersCount}</Badge>
            )}
          </Button>
          
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
              <X className="w-3 h-3" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="bg-card border rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Input
                placeholder="Filter by city or state..."
                value={filters.location || ''}
                onChange={(e) => handleLocationChange(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {clientsCount} client{clientsCount !== 1 ? 's' : ''} found
        </p>
        
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            <span className="text-sm text-muted-foreground flex-shrink-0">Active filters:</span>
            {filters.search && (
              <Badge variant="secondary" className="gap-1 flex-shrink-0">
                Search: {filters.search}
                <X className="w-3 h-3 cursor-pointer" onClick={() => handleSearchChange('')} />
              </Badge>
            )}
            {filters.status && (
              <Badge variant="secondary" className="gap-1 flex-shrink-0">
                Status: {filters.status}
                <X className="w-3 h-3 cursor-pointer" onClick={() => handleStatusChange('all')} />
              </Badge>
            )}
            {filters.location && (
              <Badge variant="secondary" className="gap-1 flex-shrink-0">
                Location: {filters.location}
                <X className="w-3 h-3 cursor-pointer" onClick={() => handleLocationChange('')} />
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientsSearch;
