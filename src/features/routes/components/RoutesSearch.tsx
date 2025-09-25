import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter } from 'lucide-react';
import { useDebouncedCallback } from '@/utils/performance';

interface RoutesSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  routesCount: number;
}

const RoutesSearch = ({ searchTerm, onSearchChange, routesCount }: RoutesSearchProps) => {
  const debouncedSetSearchTerm = useDebouncedCallback(onSearchChange, 300);

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search by origin or destination city/state..."
          value={searchTerm}
          onChange={(e) => debouncedSetSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      <Button variant="outline" className="flex items-center gap-2">
        <Filter className="w-4 h-4" />
        Filters
      </Button>
      {searchTerm && (
        <div className="text-sm text-muted-foreground flex items-center">
          Showing {routesCount} routes
        </div>
      )}
    </div>
  );
};

export default RoutesSearch;