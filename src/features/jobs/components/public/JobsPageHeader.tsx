import React from 'react';

interface JobsPageHeaderProps {
  totalCount: number;
  filteredCount: number;
}

/**
 * Header section for the public jobs page
 */
export function JobsPageHeader({ totalCount, filteredCount }: JobsPageHeaderProps) {
  return (
    <div className="mb-6 lg:mb-8">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-2 lg:mb-4 text-black">
        Find Your Next Opportunity
      </h1>
      <p className="text-base lg:text-xl text-black/80 mb-4 lg:mb-6">
        Discover job openings from top companies
      </p>
    </div>
  );
}

interface JobsResultsCountProps {
  filteredCount: number;
  totalCount: number;
}

/**
 * Results count display
 */
export function JobsResultsCount({ filteredCount, totalCount }: JobsResultsCountProps) {
  return (
    <div className="flex items-center justify-between mt-4 lg:mt-0">
      <p className="text-sm lg:text-base text-muted-foreground">
        Showing {filteredCount} of {totalCount} job{totalCount !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
