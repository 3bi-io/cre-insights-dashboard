import React from 'react';
import { Button } from '@/components/ui/button';
import { Grid3X3, Table } from 'lucide-react';

type ViewMode = 'grid' | 'table';

interface JobsViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const JobsViewToggle: React.FC<JobsViewToggleProps> = ({
  viewMode,
  onViewModeChange,
}) => {
  return (
    <div className="flex items-center gap-1 sm:gap-2 bg-muted p-1 rounded-lg w-fit">
      <Button
        variant={viewMode === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('grid')}
        className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3"
      >
        <Grid3X3 className="w-4 h-4" />
        <span className="hidden sm:inline">Grid</span>
      </Button>
      <Button
        variant={viewMode === 'table' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('table')}
        className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3"
      >
        <Table className="w-4 h-4" />
        <span className="hidden sm:inline">Table</span>
      </Button>
    </div>
  );
};
