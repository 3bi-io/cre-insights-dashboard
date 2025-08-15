import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface JobsErrorStateProps {
  error: unknown;
  onRetry: () => void;
}

const JobsErrorState: React.FC<JobsErrorStateProps> = ({ error, onRetry }) => {
  return (
    <div className="p-6">
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h1 className="text-2xl font-bold mb-4">Error Loading Jobs</h1>
        <p className="text-muted-foreground mb-4">
          {error instanceof Error ? error.message : 'There was an error loading your job listings'}
        </p>
        <Button onClick={onRetry} className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
};

export default JobsErrorState;