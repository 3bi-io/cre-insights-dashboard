import React, { useState, useEffect } from 'react';
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
  // Local state for immediate visual feedback
  const [inputValue, setInputValue] = useState(searchTerm);
  const debouncedSetSearchTerm = useDebouncedCallback(onSearchChange, 300);

  // Sync local state when parent clears/changes the value externally
  useEffect(() => {
    setInputValue(searchTerm);
  }, [searchTerm]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value); // Immediate visual update
    debouncedSetSearchTerm(value); // Debounced filter update
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search by origin or destination city/state..."
          value={inputValue}
          onChange={handleChange}
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