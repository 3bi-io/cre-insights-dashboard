/**
 * Job Map Page
 * Interactive map visualization of job locations with heat map and accessibility features
 */

import { useState, Suspense, lazy, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { MapPin, Loader2 } from 'lucide-react';
import { useJobMapData, JobMapFilters, MapLocation } from '@/hooks/useJobMapData';
import { MapFilters, MapStats, JobListPanel, MapLayerControls } from '@/components/map';

// Lazy load the map component to reduce initial bundle size
const JobMap = lazy(() => import('@/components/map/JobMap').then(m => ({ default: m.JobMap })));

// Loading fallback for map
function MapLoadingFallback() {
  return (
    <div 
      className="w-full h-full flex items-center justify-center bg-muted/30 rounded-lg"
      role="status"
      aria-label="Loading map"
    >
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin" aria-hidden="true" />
        <p className="text-sm">Loading map...</p>
      </div>
    </div>
  );
}

// Error fallback
function MapErrorFallback({ error }: { error: Error }) {
  return (
    <div 
      className="w-full h-full flex items-center justify-center bg-destructive/10 rounded-lg p-8"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <MapPin className="w-12 h-12 text-destructive" aria-hidden="true" />
        <h2 className="font-semibold text-lg">Failed to load map</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          {error.message || 'An unexpected error occurred while loading the map.'}
        </p>
      </div>
    </div>
  );
}

export default function JobMapPage() {
  const [filters, setFilters] = useState<JobMapFilters>({});
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [showMarkers, setShowMarkers] = useState(true);

  const {
    locations,
    stats,
    uniqueCompanies,
    uniqueCategories,
    isLoading,
    error,
  } = useJobMapData(filters);

  const handleToggleHeatMap = useCallback(() => {
    setShowHeatMap(prev => !prev);
  }, []);

  const handleToggleMarkers = useCallback(() => {
    setShowMarkers(prev => !prev);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedLocation(null);
  }, []);

  return (
    <>
      <Helmet>
        <title>Job Locations Map | ATS.me</title>
        <meta 
          name="description" 
          content="Explore job opportunities across the United States on our interactive map. Find positions near you or discover opportunities in new locations." 
        />
        <meta name="keywords" content="job map, jobs near me, job locations, employment opportunities, career map" />
        <link rel="canonical" href="https://ats.me/map" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Job Locations Map | ATS.me" />
        <meta property="og:description" content="Explore job opportunities across the United States on our interactive map." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://ats.me/map" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Job Locations Map | ATS.me" />
        <meta name="twitter:description" content="Explore job opportunities across the United States on our interactive map." />
      </Helmet>

      <main 
        className="relative w-full h-[calc(100vh-4rem)] bg-background"
        id="main-content"
      >
        {/* Skip link target for accessibility */}
        <h1 className="sr-only">Job Locations Map</h1>
        
        {/* Map Container */}
        <div className="absolute inset-0">
          {error ? (
            <MapErrorFallback error={error} />
          ) : (
            <Suspense fallback={<MapLoadingFallback />}>
              <JobMap
                locations={locations}
                selectedLocation={selectedLocation}
                onLocationSelect={setSelectedLocation}
                showHeatMap={showHeatMap}
                showMarkers={showMarkers}
              />
            </Suspense>
          )}
        </div>

        {/* Filters Overlay */}
        <MapFilters
          filters={filters}
          onFiltersChange={setFilters}
          companies={uniqueCompanies}
          categories={uniqueCategories}
        />

        {/* Stats Overlay */}
        <MapStats
          totalJobs={stats.totalJobs}
          uniqueLocations={stats.uniqueLocations}
          jobsWithLocation={stats.jobsWithLocation}
          isLoading={isLoading}
        />

        {/* Layer Controls */}
        <MapLayerControls
          showHeatMap={showHeatMap}
          onToggleHeatMap={handleToggleHeatMap}
          showMarkers={showMarkers}
          onToggleMarkers={handleToggleMarkers}
        />

        {/* Job List Panel */}
        <JobListPanel
          location={selectedLocation}
          onClose={handleClosePanel}
        />
      </main>
    </>
  );
}
