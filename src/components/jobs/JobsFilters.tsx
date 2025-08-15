import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Grid3X3, Table } from 'lucide-react';

type ViewMode = 'grid' | 'table';

interface JobsFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const JobsFilters: React.FC<JobsFiltersProps> = ({
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search jobs by title, location, platform..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
        <Button
          variant={viewMode === 'grid' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('grid')}
          className="flex items-center gap-2"
        >
          <Grid3X3 className="w-4 h-4" />
          Grid
        </Button>
        <Button
          variant={viewMode === 'table' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('table')}
          className="flex items-center gap-2"
        >
          <Table className="w-4 h-4" />
          Table
        </Button>
      </div>
    </div>
  );
};

export default JobsFilters;