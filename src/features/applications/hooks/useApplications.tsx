import { useFeatureService } from '@/features/shared/hooks/useFeatureService';
import { applicationsService, Application, CreateApplicationData, UpdateApplicationData } from '../services/ApplicationsService';
import { FilterOptions } from '@/features/shared/types/feature.types';

export interface ApplicationFilters extends FilterOptions {
  job_id?: string;
  status?: string;
  cdl_license?: boolean;
  veteran_status?: boolean;
  experience_years_min?: number;
  city?: string;
  state?: string;
}

export function useApplications(options?: { 
  enabled?: boolean;
  filters?: ApplicationFilters;
}) {
  const {
    data: applications,
    totalCount,
    hasMore,
    loading,
    error,
    initialized,
    create,
    update,
    delete: deleteApplication,
    refresh,
    clearError,
    reset,
    isCreating,
    isUpdating,
    isDeleting
  } = useFeatureService<Application>(applicationsService, {
    featureName: 'Applications',
    queryKey: 'applications',
    enabled: options?.enabled,
    staleTime: 2 * 60 * 1000 // 2 minutes
  });

  // Wrapper methods with proper typing
  const createApplication = (data: CreateApplicationData) => {
    create(data);
  };

  const updateApplication = (id: string, data: UpdateApplicationData) => {
    update({ id, data });
  };

  const reviewApplication = async (id: string, status: 'reviewed' | 'interviewing' | 'hired' | 'rejected', notes?: string) => {
    const result = await applicationsService.reviewApplication(id, status, notes);
    if (!result.error) {
      refresh();
    }
    return result;
  };

  const getApplicationStats = async (jobId?: string) => {
    return await applicationsService.getApplicationStats(jobId);
  };

  return {
    // Data
    applications,
    totalCount,
    hasMore,
    loading,
    error,
    initialized,

    // Actions
    createApplication,
    updateApplication,
    deleteApplication,
    reviewApplication,
    getApplicationStats,
    refresh,
    clearError,
    reset,

    // States
    isCreating,
    isUpdating,
    isDeleting
  };
}

export default useApplications;