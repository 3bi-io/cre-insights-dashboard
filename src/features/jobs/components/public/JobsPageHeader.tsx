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
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-2 lg:mb-4 text-foreground">
        Find Your Next Opportunity
      </h1>
      <span className="inline-block text-base lg:text-xl text-black font-medium bg-white rounded-full px-6 py-2 mb-3">
        Discover job openings from top companies
      </span>
      <div>
        <span className="inline-block text-base lg:text-xl text-black font-medium bg-white rounded-full px-6 py-2 mb-4 lg:mb-6">
          {totalCount.toLocaleString()} Jobs Available
        </span>
      </div>
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
