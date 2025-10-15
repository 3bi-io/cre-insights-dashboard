import { useQuery } from '@tanstack/react-query';
import { ApplicationService } from '../services';

/**
 * Hook to fetch all applications with caching
 */
export const useApplicationData = () => {
  const {
    data: applications,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['applications'],
    queryFn: ApplicationService.fetchApplications,
    staleTime: 30000, // Data fresh for 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });

  return {
    applications,
    isLoading,
    error,
    refetch
  };
};

/**
 * Hook to fetch a single application
 */
export const useApplication = (id: string) => {
  const {
    data: application,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['application', id],
    queryFn: () => ApplicationService.fetchApplication(id),
    enabled: !!id,
    staleTime: 20000,
  });

  return {
    application,
    isLoading,
    error,
    refetch
  };
};

/**
 * Hook to fetch applications for a specific job
 */
export const useJobApplications = (jobListingId: string) => {
  const {
    data: applications,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['applications', 'job', jobListingId],
    queryFn: () => ApplicationService.fetchApplicationsByJob(jobListingId),
    enabled: !!jobListingId,
    staleTime: 30000,
  });

  return {
    applications,
    isLoading,
    error,
    refetch
  };
};
