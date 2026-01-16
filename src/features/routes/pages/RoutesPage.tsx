import React, { useState, useCallback } from 'react';
import { PageLayout } from '@/features/shared';
import {
  RoutesHeader,
  RoutesSearch,
  RoutesGrid
} from '../components';
import { useRoutes } from '../hooks';
import { useStableFilter } from '@/utils/performance';
import { logger } from '@/lib/logger';

interface Route {
  origin_city: string;
  origin_state: string;
  dest_city: string;
  dest_state: string;
  job_count: number;
}

const RoutesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const {
    routes,
    isLoading,
    error,
    isAdmin,
    organization,
    userRole
  } = useRoutes();

  // Memoized filter predicate
  const filterPredicate = useCallback((route: Route) =>
    route.origin_city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.origin_state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.dest_city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.dest_state?.toLowerCase().includes(searchTerm.toLowerCase())
  , [searchTerm]);

  // Stable filtered routes to prevent unnecessary re-renders
  const filteredRoutes = useStableFilter(routes, filterPredicate, [searchTerm]);

  // Debug logging
  logger.debug('Routes Page Debug', {
    routesCount: routes?.length || 0,
    filteredCount: filteredRoutes?.length || 0,
    loading: isLoading,
    error,
    userRole,
    isAdmin,
    organization: organization?.name || 'No organization',
    organizationId: organization?.id || 'No ID',
    searchTerm
  });

  if (isLoading) {
    return (
      <PageLayout title="Routes" description="View transportation routes from job listings">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Routes" description="View transportation routes from job listings">
        <div className="p-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Error Loading Routes</h1>
            <p className="text-muted-foreground mb-4">
              There was an error loading your routes data: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
            {userRole === 'super_admin' && (
              <p className="text-sm text-muted-foreground mt-2">
                Super Admin: You should have access to all routes
              </p>
            )}
            {!organization && userRole !== 'super_admin' && (
              <p className="text-sm text-muted-foreground mt-2">
                No organization found. Please contact your administrator.
              </p>
            )}
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="Routes" 
      description="View transportation routes from job listings"
    >
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <RoutesHeader routesCount={routes?.length || 0} />
        <div className="space-y-6">
          <RoutesSearch 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            routesCount={filteredRoutes?.length || 0}
          />
          <RoutesGrid routes={filteredRoutes || []} />
        </div>
      </div>
    </PageLayout>
  );
};

export default RoutesPage;