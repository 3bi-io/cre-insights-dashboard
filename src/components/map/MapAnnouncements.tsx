/**
 * Screen Reader Announcements for Map
 * Centralized live region announcements for accessibility
 */

import { memo, useEffect, useState, useCallback, useRef } from 'react';
import { MapLocation } from '@/hooks/useJobMapData';

interface MapAnnouncementsProps {
  // Data state
  totalJobs: number;
  totalLocations: number;
  isLoading: boolean;
  
  // Selection state
  selectedLocation: MapLocation | null;
  
  // Layer state
  showHeatMap: boolean;
  showMarkers: boolean;
  
  // Filter state
  hasActiveFilters: boolean;
  filterCount: number;
}

// Debounce announcements to avoid overwhelming screen readers
function useDebounceAnnouncement(delay = 500) {
  const [announcement, setAnnouncement] = useState('');
  const [debouncedAnnouncement, setDebouncedAnnouncement] = useState('');

  useEffect(() => {
    if (!announcement) return;
    
    const timer = setTimeout(() => {
      setDebouncedAnnouncement(announcement);
      // Clear after announcement
      setTimeout(() => setDebouncedAnnouncement(''), 100);
    }, delay);

    return () => clearTimeout(timer);
  }, [announcement, delay]);

  const announce = useCallback((message: string) => {
    setAnnouncement(message);
  }, []);

  return { announcement: debouncedAnnouncement, announce };
}

export const MapAnnouncements = memo(function MapAnnouncements({
  totalJobs,
  totalLocations,
  isLoading,
  selectedLocation,
  showHeatMap,
  showMarkers,
  hasActiveFilters,
  filterCount,
}: MapAnnouncementsProps) {
  const { announcement, announce } = useDebounceAnnouncement(300);
  
  // Track previous values to detect changes
  const [prevState, setPrevState] = useState({
    isLoading,
    selectedLocation: selectedLocation?.id,
    showHeatMap,
    showMarkers,
    totalJobs,
    totalLocations,
    hasActiveFilters,
  });

  useEffect(() => {
    // Loading state changed
    if (prevState.isLoading && !isLoading) {
      announce(`Map loaded. ${totalJobs} jobs across ${totalLocations} locations.`);
    }
    
    // Location selected
    if (selectedLocation && selectedLocation.id !== prevState.selectedLocation) {
      announce(
        `Selected ${selectedLocation.displayName}. ${selectedLocation.jobCount} ${
          selectedLocation.jobCount === 1 ? 'job' : 'jobs'
        } available.`
      );
    }
    
    // Location deselected
    if (!selectedLocation && prevState.selectedLocation) {
      announce('Location deselected.');
    }
    
    // Heat map toggled
    if (showHeatMap !== prevState.showHeatMap) {
      announce(showHeatMap ? 'Heat map enabled.' : 'Heat map disabled.');
    }
    
    // Markers toggled
    if (showMarkers !== prevState.showMarkers) {
      announce(showMarkers ? 'Markers shown.' : 'Markers hidden.');
    }
    
    // Data changed (likely due to filtering)
    if (
      totalJobs !== prevState.totalJobs || 
      totalLocations !== prevState.totalLocations
    ) {
      if (hasActiveFilters) {
        announce(
          `Filter applied. ${totalJobs} jobs across ${totalLocations} locations match your criteria.`
        );
      }
    }

    // Update previous state
    setPrevState({
      isLoading,
      selectedLocation: selectedLocation?.id,
      showHeatMap,
      showMarkers,
      totalJobs,
      totalLocations,
      hasActiveFilters,
    });
  }, [
    isLoading,
    selectedLocation,
    showHeatMap,
    showMarkers,
    totalJobs,
    totalLocations,
    hasActiveFilters,
    prevState,
    announce,
  ]);

  return (
    <>
      {/* Assertive announcements for important state changes */}
      <div 
        role="status"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {isLoading && 'Loading job locations...'}
      </div>
      
      {/* Polite announcements for general updates */}
      <div 
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
      
      {/* Persistent status for screen readers */}
      <div className="sr-only" aria-hidden="true">
        <p>
          Currently showing {totalJobs} jobs across {totalLocations} locations.
          {hasActiveFilters && ` ${filterCount} filter${filterCount > 1 ? 's' : ''} active.`}
          {showHeatMap && ' Heat map is enabled.'}
          {!showMarkers && ' Markers are hidden.'}
        </p>
      </div>
    </>
  );
});

/**
 * Simple announcement hook for one-off messages
 */
export function useMapAnnouncement() {
  const [message, setMessage] = useState('');

  const announce = useCallback((text: string) => {
    setMessage(text);
    // Clear after brief delay to allow re-announcement of same text
    setTimeout(() => setMessage(''), 100);
  }, []);

  const AnnouncementRegion = memo(function AnnouncementRegion() {
    return (
      <div 
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {message}
      </div>
    );
  });

  return { announce, AnnouncementRegion };
}

export default MapAnnouncements;
