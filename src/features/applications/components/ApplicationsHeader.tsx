import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, LayoutGrid, Table } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface ApplicationsHeaderProps {
  totalCount: number;
  viewMode: 'card' | 'table';
  onViewModeChange: (mode: 'card' | 'table') => void;
}

export const ApplicationsHeader = ({ 
  totalCount, 
  viewMode, 
  onViewModeChange 
}: ApplicationsHeaderProps) => {
  return (
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="bg-primary/10 text-base px-4 py-1.5">
          {totalCount} Total Applications
        </Badge>
        <Link to="/admin/ai-analytics">
          <Button variant="outline" size="sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            AI Analytics
          </Button>
        </Link>
      </div>
      
      <ToggleGroup 
        type="single" 
        value={viewMode} 
        onValueChange={(value) => value && onViewModeChange(value as 'card' | 'table')}
        className="border border-input rounded-md p-1 bg-background"
      >
        <ToggleGroupItem value="card" aria-label="Card view" variant="outline">
          <LayoutGrid className="w-4 h-4" />
          <span className="ml-2 hidden sm:inline">Grid</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="table" aria-label="Table view" variant="outline">
          <Table className="w-4 h-4" />
          <span className="ml-2 hidden sm:inline">Table</span>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};
