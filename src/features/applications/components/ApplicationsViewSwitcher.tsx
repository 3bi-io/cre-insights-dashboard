import { LayoutGrid, Table } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type ViewMode = 'grid' | 'table';

interface ApplicationsViewSwitcherProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const ApplicationsViewSwitcher = ({ 
  viewMode, 
  onViewModeChange 
}: ApplicationsViewSwitcherProps) => {
  return (
    <div className="flex items-center gap-1 border rounded-md p-1">
      <Button
        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('grid')}
        className="h-8 px-3"
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="ml-2 hidden sm:inline">Grid</span>
      </Button>
      <Button
        variant={viewMode === 'table' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('table')}
        className="h-8 px-3"
      >
        <Table className="h-4 w-4" />
        <span className="ml-2 hidden sm:inline">Table</span>
      </Button>
    </div>
  );
};
