import { useFeatureService } from '@/features/shared/hooks/useFeatureService';
import { jobGroupsService, JobGroup, CreateJobGroupData, UpdateJobGroupData } from '../services/JobGroupsService';
import { FilterOptions } from '@/features/shared/types/feature.types';

export interface JobGroupFilters extends FilterOptions {
  campaignId?: string;
}

export function useJobGroups(options?: { 
  enabled?: boolean;
  filters?: JobGroupFilters;
}) {
  const queryKey = options?.filters?.campaignId 
    ? ['job-groups', options.filters.campaignId]
    : ['job-groups'];

  const {
    data: jobGroups,
    totalCount,
    hasMore,
    loading,
    error,
    initialized,
    create,
    update,
    delete: deleteJobGroup,
    refresh,
    clearError,
    reset,
    isCreating,
    isUpdating,
    isDeleting
  } = useFeatureService<JobGroup>(jobGroupsService, {
    featureName: 'Job Groups',
    queryKey: queryKey.join('-'),
    enabled: options?.enabled,
    staleTime: 2 * 60 * 1000 // 2 minutes
  });

  // Wrapper methods with proper typing
  const createJobGroup = (data: CreateJobGroupData) => {
    create(data);
  };

  const updateJobGroup = (id: string, data: UpdateJobGroupData) => {
    update({ id, data });
  };

  const assignJobsToGroup = async (jobGroupId: string, jobListingIds: string[]) => {
    const result = await jobGroupsService.assignJobsToGroup(jobGroupId, jobListingIds);
    if (!result.error) {
      refresh();
    }
    return result;
  };

  const getJobGroupAssignments = async (jobGroupId: string) => {
    return await jobGroupsService.getJobGroupAssignments(jobGroupId);
  };

  const getXMLFeed = async (jobGroupId: string) => {
    return await jobGroupsService.getJobGroupXMLFeed(jobGroupId);
  };

  return {
    // Data
    jobGroups,
    totalCount,
    hasMore,
    loading,
    error,
    initialized,

    // Actions
    createJobGroup,
    updateJobGroup,
    deleteJobGroup,
    assignJobsToGroup,
    getJobGroupAssignments,
    getXMLFeed,
    refresh,
    clearError,
    reset,

    // States
    isCreating,
    isUpdating,
    isDeleting
  };
}