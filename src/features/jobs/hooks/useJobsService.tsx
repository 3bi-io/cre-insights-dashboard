import { useFeatureService } from '@/features/shared/hooks/useFeatureService';
import { jobsService, Job, CreateJobData, UpdateJobData } from '../services/JobsService';
import { FilterOptions } from '@/features/shared/types/feature.types';

export interface JobFilters extends FilterOptions {
  location?: string;
  employment_type?: string;
  remote_allowed?: boolean;
  experience_level?: string;
}

export function useJobsService(options?: { 
  enabled?: boolean;
  filters?: JobFilters;
}) {
  const {
    data: jobs,
    totalCount,
    hasMore,
    loading,
    error,
    initialized,
    create,
    update,
    delete: deleteJob,
    refresh,
    clearError,
    reset,
    isCreating,
    isUpdating,
    isDeleting
  } = useFeatureService<Job>(jobsService, {
    featureName: 'Jobs',
    queryKey: 'jobs',
    enabled: options?.enabled,
    staleTime: 2 * 60 * 1000 // 2 minutes
  });

  // Wrapper methods with proper typing
  const createJob = (data: CreateJobData) => {
    create(data);
  };

  const updateJob = (id: string, data: UpdateJobData) => {
    update({ id, data });
  };

  const duplicateJob = async (id: string, title: string) => {
    const result = await jobsService.duplicateJob(id, title);
    if (!result.error) {
      refresh();
    }
    return result;
  };

  const activateJob = async (id: string) => {
    const result = await jobsService.activateJob(id);
    if (!result.error) {
      refresh();
    }
    return result;
  };

  const deactivateJob = async (id: string) => {
    const result = await jobsService.deactivateJob(id);
    if (!result.error) {
      refresh();
    }
    return result;
  };

  return {
    // Data
    jobs,
    totalCount,
    hasMore,
    loading,
    error,
    initialized,

    // Actions
    createJob,
    updateJob,
    deleteJob,
    duplicateJob,
    activateJob,
    deactivateJob,
    refresh,
    clearError,
    reset,

    // States
    isCreating,
    isUpdating,
    isDeleting
  };
}