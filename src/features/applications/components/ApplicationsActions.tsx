import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download } from 'lucide-react';

interface ApplicationsActionsProps {
  selectedCount: number;
  onExportPDF: () => void;
  onExportCSV: () => void;
  onBulkStatusChange: (status: 'pending' | 'reviewed' | 'interviewing' | 'hired' | 'rejected') => void;
  onClearSelection: () => void;
}

export const ApplicationsActions = ({
  selectedCount,
  onExportPDF,
  onExportCSV,
  onBulkStatusChange,
  onClearSelection,
}: ApplicationsActionsProps) => {
  return (
    <div className="flex gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onExportPDF}>
            Export as PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportCSV}>
            Export as CSV
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {selectedCount > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              Bulk Actions ({selectedCount})
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onBulkStatusChange('reviewed')}>
              Mark as Reviewed
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onBulkStatusChange('interviewing')}>
              Move to Interviewing
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onBulkStatusChange('rejected')}>
              Reject Selected
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onClearSelection}>
              Clear Selection
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};
