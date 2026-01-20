import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  loadingRows?: number;
  emptyMessage?: string;
  selectable?: boolean;
  selectedRows?: Set<string>;
  onSelectRow?: (id: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  getRowId?: (row: T) => string;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  isLoading = false,
  loadingRows = 5,
  emptyMessage = 'No data available',
  selectable = false,
  selectedRows = new Set(),
  onSelectRow,
  onSelectAll,
  getRowId = (row: any) => row.id,
  sortColumn,
  sortDirection,
  onSort,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const allSelected = data.length > 0 && data.every(row => selectedRows.has(getRowId(row)));
  const someSelected = data.some(row => selectedRows.has(getRowId(row))) && !allSelected;

  const handleSelectAll = (checked: boolean) => {
    onSelectAll?.(checked);
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    onSelectRow?.(id, checked);
  };

  const renderSortIcon = (columnId: string) => {
    if (sortColumn !== columnId) {
      return <ChevronsUpDown className="ml-1 h-4 w-4 text-muted-foreground/50" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="ml-1 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4" />
    );
  };

  if (isLoading) {
    return (
      <Table className={className}>
        <TableHeader>
          <TableRow>
            {selectable && <TableHead className="w-12"><Skeleton className="h-4 w-4" /></TableHead>}
            {columns.map(col => (
              <TableHead key={col.id} className={col.className}>
                <Skeleton className="h-4 w-24" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: loadingRows }).map((_, i) => (
            <TableRow key={i}>
              {selectable && <TableCell><Skeleton className="h-4 w-4" /></TableCell>}
              {columns.map(col => (
                <TableCell key={col.id} className={col.className}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <Table className={className}>
      <TableHeader>
        <TableRow>
          {selectable && (
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected || (someSelected ? 'indeterminate' : false)}
                onCheckedChange={handleSelectAll}
                aria-label="Select all"
              />
            </TableHead>
          )}
          {columns.map(col => (
            <TableHead
              key={col.id}
              className={cn(
                col.className,
                col.sortable && 'cursor-pointer select-none hover:bg-muted/50'
              )}
              onClick={col.sortable ? () => onSort?.(col.id) : undefined}
            >
              <div className="flex items-center">
                {col.header}
                {col.sortable && renderSortIcon(col.id)}
              </div>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map(row => {
          const rowId = getRowId(row);
          const isSelected = selectedRows.has(rowId);

          return (
            <TableRow
              key={rowId}
              className={cn(
                isSelected && 'bg-muted/50',
                onRowClick && 'cursor-pointer hover:bg-muted/50'
              )}
              onClick={() => onRowClick?.(row)}
            >
              {selectable && (
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => handleSelectRow(rowId, checked as boolean)}
                    aria-label={`Select row ${rowId}`}
                  />
                </TableCell>
              )}
              {columns.map(col => (
                <TableCell key={col.id} className={col.className}>
                  {col.cell
                    ? col.cell(row)
                    : col.accessorKey
                    ? String((row as any)[col.accessorKey] ?? '')
                    : ''}
                </TableCell>
              ))}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export default DataTable;
