import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface JobsLoadMoreButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

/**
 * Load more button for infinite scroll pagination
 */
export function JobsLoadMoreButton({ onClick, isLoading }: JobsLoadMoreButtonProps) {
  return (
    <div className="flex justify-center mt-6 lg:mt-8 pb-6">
      <Button
        onClick={onClick}
        disabled={isLoading}
        variant="outline"
        size="lg"
        className="w-full sm:w-auto min-h-[48px]"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Loading...
          </>
        ) : (
          <>Load More Jobs</>
        )}
      </Button>
    </div>
  );
}
