import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export type SortDirection = 'asc' | 'desc' | null;

interface TableSortHeaderProps {
  label: string;
  sortKey: string;
  currentSortKey: string | null;
  currentSortDirection: SortDirection;
  onSort: (key: string) => void;
}

export const TableSortHeader = ({
  label,
  sortKey,
  currentSortKey,
  currentSortDirection,
  onSort,
}: TableSortHeaderProps) => {
  const isActive = currentSortKey === sortKey;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 hover:bg-muted/50"
      onClick={() => onSort(sortKey)}
    >
      <span>{label}</span>
      {isActive && currentSortDirection === 'asc' && (
        <ArrowUp className="ml-2 h-4 w-4" />
      )}
      {isActive && currentSortDirection === 'desc' && (
        <ArrowDown className="ml-2 h-4 w-4" />
      )}
      {!isActive && (
        <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
      )}
    </Button>
  );
};
