import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface JobsClientFilterProps {
  clientFilter: string | null;
  hasClientFilter: boolean;
  onClearFilter: () => void;
}

export const JobsClientFilter: React.FC<JobsClientFilterProps> = ({
  clientFilter,
  hasClientFilter,
  onClearFilter,
}) => {
  if (!hasClientFilter) {
    return null;
  }

  return (
    <div className="mb-4">
      <Badge variant="secondary" className="flex items-center gap-2 w-fit">
        Filtered by client: {clientFilter}
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
          onClick={onClearFilter}
        >
          <X className="w-3 h-3" />
        </Button>
      </Badge>
    </div>
  );
};
