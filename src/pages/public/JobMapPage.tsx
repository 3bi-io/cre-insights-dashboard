/**
 * Job Map Page
 * Interactive map visualization with display modes, confidence system, and mobile UX
 */

import { useState, Suspense, lazy, useCallback, useMemo, useEffect } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { useJobMapData, JobMapFilters, MapLocation } from '@/hooks/useJobMapData';
import { MapFilters, JobListPanel, MapLayerControls, MapAIAssistantPanel } from '@/components/map';
import { MapProvider, useMapContext } from '@/components/map/MapContext';
import { MapAnnouncements } from '@/components/map/MapAnnouncements';
import { MobileViewSwitcher, MobileViewMode } from '@/components/map/MobileMapListView';
import { MobileJobListView } from '@/components/map/MobileJobListView';
import { SEO } from '@/components/SEO';
import { StructuredData } from '@/components/StructuredData';
import { buildBreadcrumbSchema } from '@/utils/breadcrumbSchema';
import { type DisplayMode } from '@/components/map/constants';
import { 
  MapFiltersSkeleton, 
  MapControlsSkeleton 
} from '@/components/map/MapSkeletons';

const JobMap = lazy(() => import('@/components/map/JobMap').then(m => ({ default: m.JobMap })));

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

function JobMapPageContent() {
  const { isMobile } = useMapContext();
  
  const [filters, setFilters] = useState<JobMapFilters>({});
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [showMarkers, setShowMarkers] = useState(true);
  const [mobileViewMode, setMobileViewMode] = useState<MobileViewMode>('map');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('standard');

  // Density mode auto-enables heat map
  useEffect(() => {
    if (displayMode === 'density') {
      setShowHeatMap(true);
    }
  }, [displayMode]);

  const {
    locations,
    stats,
    uniqueCompanies,
    uniqueCategories,
    isLoading,
    error,
  } = useJobMapData(filters);

  const handleToggleHeatMap = useCallback(() => setShowHeatMap(prev => !prev), []);
  const handleToggleMarkers = useCallback(() => setShowMarkers(prev => !prev), []);
  const handleClosePanel = useCallback(() => setSelectedLocation(null), []);
  const handleDisplayModeChange = useCallback((mode: DisplayMode) => setDisplayMode(mode), []);

  const activeFilterCount = useMemo(() => {
    return [
      filters.searchTerm,
      filters.clientFilter,
      filters.categoryFilter,
      filters.exactOnly ? 'exact' : undefined,
    ].filter(Boolean).length;
  }, [filters]);

  const hasActiveFilters = activeFilterCount > 0;

  const mapBreadcrumbs = useMemo(() => buildBreadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Job Map', href: '/map' },
  ]), []);

  return (
    <>
      <SEO
        title="Job Locations Map"
        description="Explore job opportunities across the United States on our interactive map. Find positions near you or discover opportunities in new locations."
        keywords="job map, jobs near me, job locations, employment opportunities, career map"
        canonical="https://applyai.jobs/map"
        ogImage="https://applyai.jobs/og-map.png"
      />
      <StructuredData data={mapBreadcrumbs} />

      <MapAnnouncements
        totalJobs={stats.totalJobs}
        totalLocations={stats.uniqueLocations}
        isLoading={isLoading}
        selectedLocation={selectedLocation}
        showHeatMap={showHeatMap}
        showMarkers={showMarkers}
        hasActiveFilters={hasActiveFilters}
        filterCount={activeFilterCount}
      />

      <main 
        className="relative w-full h-[100dvh] pt-16 pb-safe bg-background overflow-hidden"
        id="main-content"
      >
        <h1 className="sr-only">Job Locations Map</h1>
        
        {/* Map Container */}
        <div className={`absolute inset-0 top-16 ${isMobile && mobileViewMode === 'list' ? 'invisible' : ''}`}>
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
                autoFitBounds={hasActiveFilters}
                displayMode={displayMode}
              />
            </Suspense>
          )}
        </div>

        {/* Mobile List View */}
        {isMobile && mobileViewMode === 'list' && (
          <div className="absolute inset-0 top-16 overflow-y-auto bg-background" id="list-panel" role="tabpanel">
            <MobileJobListView
              locations={locations}
              isLoading={isLoading}
              onLocationSelect={(loc) => {
                setSelectedLocation(loc);
                setMobileViewMode('map');
              }}
            />
          </div>
        )}

        {/* Filters Overlay */}
        {isLoading && locations.length === 0 ? (
          <MapFiltersSkeleton isMobile={isMobile} />
        ) : (
          <MapFilters
            filters={filters}
            onFiltersChange={setFilters}
            companies={uniqueCompanies}
            categories={uniqueCategories}
            displayMode={displayMode}
            onDisplayModeChange={handleDisplayModeChange}
          />
        )}

        {/* Stats Overlay */}
        {(!isMobile || mobileViewMode === 'map') && (
          <MapStats
            totalJobs={stats.totalJobs}
            uniqueLocations={stats.uniqueLocations}
            jobsWithLocation={stats.jobsWithLocation}
            exactCount={stats.exactCount}
            stateCount={stats.stateCount}
            countryCount={stats.countryCount}
            visibleJobs={stats.visibleJobs}
            isLoading={isLoading && locations.length === 0}
          />
        )}

        {/* Layer Controls */}
        {(!isMobile || mobileViewMode === 'map') && (
          isLoading && locations.length === 0 ? (
            <MapControlsSkeleton isMobile={isMobile} />
          ) : (
            <MapLayerControls
              showHeatMap={showHeatMap}
              onToggleHeatMap={handleToggleHeatMap}
              showMarkers={showMarkers}
              onToggleMarkers={handleToggleMarkers}
              displayMode={displayMode}
            />
          )
        )}

        {/* Mobile View Switcher */}
        {isMobile && !isLoading && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000]">
            <MobileViewSwitcher
              mode={mobileViewMode}
              onModeChange={setMobileViewMode}
            />
          </div>
        )}

        {/* Job List Panel */}
        <JobListPanel
          location={selectedLocation}
          onClose={handleClosePanel}
        />
      </main>
    </>
  );
}

export default function JobMapPage() {
  return (
    <MapProvider>
      <JobMapPageContent />
    </MapProvider>
  );
}
