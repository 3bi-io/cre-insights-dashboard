
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter } from 'lucide-react';

interface JobsSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const JobsSearch: React.FC<JobsSearchProps> = ({ searchTerm, onSearchChange }) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search jobs by title or location..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
        <Filter className="w-4 h-4" />
        <span>Filters</span>
      </Button>
    </div>
  );
};

export default JobsSearch;
