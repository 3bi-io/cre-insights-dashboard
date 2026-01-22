import { useMemo } from 'react';
import { usePaginatedPublicJobs } from './usePaginatedPublicJobs';
import { getLocationCoordinates } from '@/utils/usaCityCoordinates';

export interface MapJob {
  id: string;
  title: string;
  job_title?: string;
  city?: string;
  state?: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  salary_type?: string;
  job_summary?: string;
  created_at?: string;
  organizations?: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
  };
  clients?: {
    id: string;
    name: string;
    logo_url?: string;
  };
  job_categories?: {
    name: string;
  };
}

export interface MapLocation {
  id: string;
  city: string;
  state: string;
  displayName: string;
  lat: number;
  lng: number;
  isExact: boolean;
  jobCount: number;
  jobs: MapJob[];
  companies: string[];
  topCategories: string[];
}

export interface JobMapFilters {
  searchTerm?: string;
  clientFilter?: string;
  categoryFilter?: string;
}

export function useJobMapData(filters: JobMapFilters = {}) {
  const { 
    jobs, 
    totalCount, 
    isLoading, 
    error,
    hasMore,
    loadMore 
  } = usePaginatedPublicJobs({
    searchTerm: filters.searchTerm,
    clientFilter: filters.clientFilter,
    categoryFilter: filters.categoryFilter,
  });

  // Aggregate jobs by location
  const { locations, stats } = useMemo(() => {
    const locationMap = new Map<string, MapLocation>();
    let jobsWithLocation = 0;
    let jobsWithoutLocation = 0;

    jobs.forEach((job: MapJob) => {
      // Try to get location from city/state or parse from location string
      let city = job.city;
      let state = job.state;

      // If no city/state, try to parse from location string
      if (!city && !state && job.location) {
        const parts = job.location.split(',').map(p => p.trim());
        if (parts.length >= 2) {
          city = parts[0];
          state = parts[parts.length - 1];
        } else if (parts.length === 1) {
          // Could be just a state
          state = parts[0];
        }
      }

      // Get coordinates
      const coords = getLocationCoordinates(city, state);
      
      if (!coords) {
        jobsWithoutLocation++;
        return;
      }

      jobsWithLocation++;

      // Create location key
      const locationKey = coords.isExact 
        ? `${city?.toLowerCase()}-${state?.toLowerCase()}`
        : `state-${state?.toLowerCase()}`;

      const displayName = coords.isExact && city
        ? `${city}, ${state}`
        : state || 'Unknown';

      if (!locationMap.has(locationKey)) {
        locationMap.set(locationKey, {
          id: locationKey,
          city: city || '',
          state: state || '',
          displayName,
          lat: coords.lat,
          lng: coords.lng,
          isExact: coords.isExact,
          jobCount: 0,
          jobs: [],
          companies: [],
          topCategories: [],
        });
      }

      const location = locationMap.get(locationKey)!;
      location.jobCount++;
      location.jobs.push(job);

      // Track unique companies
      const companyName = job.clients?.name || job.organizations?.name;
      if (companyName && !location.companies.includes(companyName)) {
        location.companies.push(companyName);
      }

      // Track categories
      const category = job.job_categories?.name;
      if (category && !location.topCategories.includes(category)) {
        location.topCategories.push(category);
      }
    });

    // Sort jobs within each location by date
    locationMap.forEach(location => {
      location.jobs.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });
      
      // Limit categories shown
      location.topCategories = location.topCategories.slice(0, 3);
    });

    return {
      locations: Array.from(locationMap.values()),
      stats: {
        totalJobs: jobs.length,
        jobsWithLocation,
        jobsWithoutLocation,
        uniqueLocations: locationMap.size,
      }
    };
  }, [jobs]);

  // Get unique companies for filtering
  const uniqueCompanies = useMemo(() => {
    const companies = new Map<string, { id: string; name: string }>();
    jobs.forEach((job: MapJob) => {
      if (job.clients?.id && job.clients?.name) {
        companies.set(job.clients.id, { id: job.clients.id, name: job.clients.name });
      }
    });
    return Array.from(companies.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [jobs]);

  // Get unique categories for filtering
  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    jobs.forEach((job: MapJob) => {
      if (job.job_categories?.name) {
        categories.add(job.job_categories.name);
      }
    });
    return Array.from(categories).sort();
  }, [jobs]);

  return {
    locations,
    stats,
    uniqueCompanies,
    uniqueCategories,
    totalCount,
    isLoading,
    error,
    hasMore,
    loadMore,
  };
}
