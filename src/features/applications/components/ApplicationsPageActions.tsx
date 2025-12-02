import React from 'react';
import { LayoutGrid, Table as TableIcon } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ApplicationsActions } from '../components';
import { TableColumnVisibility, ColumnVisibility } from '../components/TableColumnVisibility';
import type { Application } from '@/types/common.types';

interface ApplicationsPageActionsProps {
  viewMode: 'card' | 'table';
  onViewModeChange: (mode: 'card' | 'table') => void;
  columnVisibility: ColumnVisibility;
  onColumnVisibilityChange: (column: keyof ColumnVisibility) => void;
  applications: Application[];
  selectedApplications: Set<string>;
  selectionCount: number;
  onExport: (format: 'pdf' | 'csv' | 'xlsx') => void;
  onBulkStatusChange: (status: string) => void;
  onBulkDelete: () => Promise<void>;
  onClearSelection: () => void;
}

export const ApplicationsPageActions = ({
  viewMode,
  onViewModeChange,
  columnVisibility,
  onColumnVisibilityChange,
  applications,
  selectedApplications,
  selectionCount,
  onExport,
  onBulkStatusChange,
  onBulkDelete,
  onClearSelection,
}: ApplicationsPageActionsProps) => {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <ToggleGroup 
        type="single" 
        value={viewMode} 
        onValueChange={(value) => value && onViewModeChange(value as 'card' | 'table')}
        className="border border-input rounded-md p-1 bg-background"
      >
        <ToggleGroupItem value="card" aria-label="Card view" variant="outline">
          <LayoutGrid className="w-4 h-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="table" aria-label="Table view" variant="outline">
          <TableIcon className="w-4 h-4" />
        </ToggleGroupItem>
      </ToggleGroup>
      
      {viewMode === 'table' && (
        <TableColumnVisibility
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={onColumnVisibilityChange}
        />
      )}
      
      <ApplicationsActions
        selectedCount={selectionCount}
        onExportPDF={() => onExport('pdf')}
        onExportCSV={() => onExport('csv')}
        onBulkStatusChange={onBulkStatusChange}
        onBulkDelete={onBulkDelete}
        onBulkExportSelected={() => {
          const selectedApps = applications.filter(app => selectedApplications.has(app.id));
          onExport('xlsx');
        }}
        onClearSelection={onClearSelection}
      />
    </div>
  );
};
