import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getLocationCoordinates, isNonUSLocation, getInternationalCoordinates } from '@/utils/usaCityCoordinates';

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
  client_id?: string;
  category_id?: string;
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
  const { searchTerm = '', clientFilter = '', categoryFilter = '' } = filters;

  // Fetch ALL active jobs in a single query (no pagination)
  const { data: allJobs = [], isLoading, error } = useQuery({
    queryKey: ['map-jobs', searchTerm, clientFilter, categoryFilter],
    queryFn: async () => {
      // 1. Fetch jobs
      let query = supabase
        .from('job_listings')
        .select('id, title, job_title, city, state, location, salary_min, salary_max, salary_type, job_summary, created_at, client_id, category_id')
        .eq('status', 'active')
        .eq('is_hidden', false)
        .limit(5000);

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,job_title.ilike.%${searchTerm}%,job_summary.ilike.%${searchTerm}%`);
      }
      if (clientFilter) {
        query = query.eq('client_id', clientFilter);
      }
      if (categoryFilter) {
        query = query.eq('category_id', categoryFilter);
      }

      const { data: jobs, error: jobsError } = await query;
      if (jobsError) throw jobsError;
      if (!jobs || jobs.length === 0) return [];

      // 2. Fetch client info for all unique client_ids
      const clientIds = [...new Set(jobs.map(j => j.client_id).filter(Boolean))] as string[];
      const clientMap = new Map<string, { id: string; name: string; logo_url?: string }>();

      if (clientIds.length > 0) {
        const { data: clients } = await supabase
          .from('public_client_info')
          .select('id, name, logo_url')
          .in('id', clientIds);
        clients?.forEach(c => clientMap.set(c.id, c));
      }

      // 3. Fetch category names for all unique category_ids
      const categoryIds = [...new Set(jobs.map(j => j.category_id).filter(Boolean))] as string[];
      const categoryMap = new Map<string, string>();

      if (categoryIds.length > 0) {
        const { data: categories } = await supabase
          .from('job_categories')
          .select('id, name')
          .in('id', categoryIds);
        categories?.forEach(c => categoryMap.set(c.id, c.name));
      }

      // 4. Enrich jobs
      return jobs.map(job => ({
        ...job,
        clients: job.client_id ? clientMap.get(job.client_id) || null : null,
        job_categories: job.category_id ? { name: categoryMap.get(job.category_id) || '' } : null,
      })) as MapJob[];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Aggregate jobs by location
  const { locations, stats } = useMemo(() => {
    const locationMap = new Map<string, MapLocation>();
    let jobsWithLocation = 0;
    let jobsWithoutLocation = 0;

    allJobs.forEach((job: MapJob) => {
      let city = job.city;
      let state = job.state;

      if (!city && !state && job.location) {
        const parts = job.location.split(',').map(p => p.trim());
        if (parts.length >= 2) {
          city = parts[0];
          state = parts[parts.length - 1];
        } else if (parts.length === 1) {
          state = parts[0];
        }
      }

      // Sanitize city names: strip "(Hybrid)", "Híbrido (" prefixes
      if (city) {
        city = city.replace(/^\(Hybrid\)\s*/i, '').replace(/^Híbrido\s*\(/i, '').replace(/\)$/, '').trim();
      }

      // Skip non-US locations
      if (isNonUSLocation(city, state)) {
        jobsWithoutLocation++;
        return;
      }

      const coords = getLocationCoordinates(city, state);
      if (!coords) {
        jobsWithoutLocation++;
        return;
      }

      jobsWithLocation++;

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

      const companyName = job.clients?.name;
      if (companyName && !location.companies.includes(companyName)) {
        location.companies.push(companyName);
      }

      const category = job.job_categories?.name;
      if (category && !location.topCategories.includes(category)) {
        location.topCategories.push(category);
      }
    });

    locationMap.forEach(location => {
      location.jobs.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });
      location.topCategories = location.topCategories.slice(0, 3);
    });

    return {
      locations: Array.from(locationMap.values()),
      stats: {
        totalJobs: allJobs.length,
        jobsWithLocation,
        jobsWithoutLocation,
        uniqueLocations: locationMap.size,
      }
    };
  }, [allJobs]);

  // Get unique companies for filtering
  const uniqueCompanies = useMemo(() => {
    const companies = new Map<string, { id: string; name: string }>();
    allJobs.forEach((job: MapJob) => {
      if (job.clients?.id && job.clients?.name) {
        companies.set(job.clients.id, { id: job.clients.id, name: job.clients.name });
      }
    });
    return Array.from(companies.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allJobs]);

  // Get unique categories for filtering
  const uniqueCategories = useMemo(() => {
    const categories = new Map<string, { id: string; name: string }>();
    allJobs.forEach((job: MapJob) => {
      if (job.category_id && job.job_categories?.name) {
        categories.set(job.category_id, { id: job.category_id, name: job.job_categories.name });
      }
    });
    return Array.from(categories.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allJobs]);

  return {
    locations,
    stats,
    uniqueCompanies,
    uniqueCategories,
    totalCount: allJobs.length,
    isLoading,
    error,
    hasMore: false,
    loadMore: () => {},
  };
}
