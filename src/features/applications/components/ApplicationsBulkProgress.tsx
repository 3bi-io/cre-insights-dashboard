import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { BulkActionProgress } from '@/types/api.types';

interface ApplicationsBulkProgressProps {
  bulkProgress: BulkActionProgress;
}

export const ApplicationsBulkProgress = ({ bulkProgress }: ApplicationsBulkProgressProps) => {
  if (bulkProgress.status !== 'processing') {
    return null;
  }

  return (
    <Card className="border-primary/50 bg-primary/5 animate-fade-in">
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Processing bulk action...</span>
            <span className="text-muted-foreground">{bulkProgress.current}/{bulkProgress.total}</span>
          </div>
          <Progress value={bulkProgress.percentage} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
};
