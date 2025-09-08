import React, { useMemo, useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { useDebouncedCallback, useVirtualScrolling } from '@/utils/performance';

interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: any, item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface OptimizedDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  pageSize?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  title?: string;
  actions?: (item: T) => React.ReactNode;
  virtualScrolling?: boolean;
  containerHeight?: number;
  itemHeight?: number;
}

// Memoized table row component
const TableRow = React.memo(({ 
  item, 
  columns, 
  actions, 
  index 
}: { 
  item: any; 
  columns: Column<any>[]; 
  actions?: (item: any) => React.ReactNode;
  index: number;
}) => (
  <tr className={`border-b border-border hover:bg-muted/50 ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
    {columns.map((column) => (
      <td key={String(column.key)} className="px-4 py-3" style={{ width: column.width }}>
        {column.render ? column.render(item[column.key], item) : String(item[column.key] || '')}
      </td>
    ))}
    {actions && (
      <td className="px-4 py-3 text-right">
        {actions(item)}
      </td>
    )}
  </tr>
));

TableRow.displayName = "TableRow";

// Memoized pagination component
const Pagination = React.memo(({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: { 
  currentPage: number; 
  totalPages: number; 
  onPageChange: (page: number) => void;
}) => (
  <div className="flex items-center justify-between px-4 py-3 border-t border-border">
    <div className="text-sm text-muted-foreground">
      Page {currentPage} of {totalPages}
    </div>
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="w-4 h-4" />
        Previous
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  </div>
));

Pagination.displayName = "Pagination";

export function OptimizedDataTable<T extends Record<string, any>>({
  data,
  columns,
  isLoading = false,
  pageSize = 20,
  searchable = true,
  searchPlaceholder = "Search...",
  title,
  actions,
  virtualScrolling = false,
  containerHeight = 400,
  itemHeight = 60,
}: OptimizedDataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });

  // Debounced search
  const debouncedSearch = useDebouncedCallback(setSearchTerm, 300);

  // Memoized filtered and sorted data
  const processedData = useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchTerm) {
      filtered = data.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortConfig.key!];
        const bVal = b[sortConfig.key!];
        
        if (aVal === bVal) return 0;
        
        const comparison = aVal < bVal ? -1 : 1;
        return sortConfig.direction === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [data, searchTerm, sortConfig]);

  // Pagination logic
  const totalPages = Math.ceil(processedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = useMemo(() => 
    virtualScrolling ? processedData : processedData.slice(startIndex, startIndex + pageSize),
    [processedData, startIndex, pageSize, virtualScrolling]
  );

  // Virtual scrolling setup
  const virtualScrollConfig = useVirtualScrolling(
    processedData,
    itemHeight,
    containerHeight
  );

  // Handlers
  const handleSort = useCallback((key: keyof T) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  }, [debouncedSearch]);

  if (isLoading) {
    return (
      <Card>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-4">
            {searchable && <Skeleton className="h-10 w-full" />}
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        {searchable && (
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={searchPlaceholder}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
          </div>
        )}
        
        <div className="overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                    style={{ width: column.width }}
                  >
                    {column.sortable ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort(column.key)}
                        className="h-auto p-0 font-medium"
                      >
                        {column.label}
                        <ArrowUpDown className="ml-2 w-4 h-4" />
                      </Button>
                    ) : (
                      column.label
                    )}
                  </th>
                ))}
                {actions && (
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item, index) => (
                <TableRow
                  key={item.id || index}
                  item={item}
                  columns={columns}
                  actions={actions}
                  index={index}
                />
              ))}
            </tbody>
          </table>
          
          {paginatedData.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No data found
            </div>
          )}
        </div>
        
        {!virtualScrolling && totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </CardContent>
    </Card>
  );
}

export default React.memo(OptimizedDataTable);