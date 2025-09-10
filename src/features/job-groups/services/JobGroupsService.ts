import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { BaseFeatureService } from '@/features/shared/services/BaseFeatureService';
import type { ApiResponse, PaginatedResponse, FilterOptions } from '@/features/shared/types/feature.types';

type JobGroup = Database['public']['Tables']['job_groups']['Row'];
type CreateJobGroupData = Database['public']['Tables']['job_groups']['Insert'];
type UpdateJobGroupData = Database['public']['Tables']['job_groups']['Update'];
type JobGroupAssignment = Database['public']['Tables']['job_group_assignments']['Row'];

export type { JobGroup, CreateJobGroupData, UpdateJobGroupData, JobGroupAssignment };

class JobGroupsService extends BaseFeatureService {
  constructor() {
    super('job_groups', 'Job Groups');
  }

  async getJobGroups(campaignId?: string, filters?: FilterOptions): Promise<ApiResponse<PaginatedResponse<JobGroup>>> {
    return this.handleApiCall(async () => {
      let query = supabase
        .from('job_groups')
        .select(`
          *,
          campaigns!inner (
            id,
            name
          )
        `, { count: 'exact' });

      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }

      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      if (filters?.sortBy) {
        const order = filters.sortOrder || 'asc';
        query = query.order(filters.sortBy, { ascending: order === 'asc' });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || 10;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        totalCount: count || 0,
        page,
        pageSize,
        hasMore: (count || 0) > to + 1
      };
    }, 'getJobGroups');
  }

  async createJobGroup(data: CreateJobGroupData): Promise<ApiResponse<JobGroup>> {
    return this.handleApiCall(async () => {
      const { data: jobGroup, error } = await supabase
        .from('job_groups')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return jobGroup;
    }, 'createJobGroup');
  }

  async updateJobGroup(id: string, data: UpdateJobGroupData): Promise<ApiResponse<JobGroup>> {
    return this.handleApiCall(async () => {
      const { data: jobGroup, error } = await supabase
        .from('job_groups')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return jobGroup;
    }, 'updateJobGroup');
  }

  async deleteJobGroup(id: string): Promise<ApiResponse<void>> {
    return this.handleApiCall(async () => {
      const { error } = await supabase
        .from('job_groups')
        .delete()
        .eq('id', id);

      if (error) throw error;
    }, 'deleteJobGroup');
  }

  async getJobGroupAssignments(jobGroupId: string): Promise<ApiResponse<JobGroupAssignment[]>> {
    return this.handleApiCall(async () => {
      const { data, error } = await supabase
        .from('job_group_assignments')
        .select(`
          *,
          job_listings (
            id,
            title,
            status,
            location
          )
        `)
        .eq('job_group_id', jobGroupId);

      if (error) throw error;
      return data || [];
    }, 'getJobGroupAssignments');
  }

  async assignJobsToGroup(jobGroupId: string, jobListingIds: string[]): Promise<ApiResponse<void>> {
    return this.handleApiCall(async () => {
      // First, remove existing assignments
      const { error: deleteError } = await supabase
        .from('job_group_assignments')
        .delete()
        .eq('job_group_id', jobGroupId);

      if (deleteError) throw deleteError;

      // Then, add new assignments
      if (jobListingIds.length > 0) {
        const assignments = jobListingIds.map(jobListingId => ({
          job_group_id: jobGroupId,
          job_listing_id: jobListingId
        }));

        const { error: insertError } = await supabase
          .from('job_group_assignments')
          .insert(assignments);

        if (insertError) throw insertError;
      }
    }, 'assignJobsToGroup');
  }

  async getJobGroupXMLFeed(jobGroupId: string): Promise<ApiResponse<{ xml: string; url: string }>> {
    return this.handleApiCall(async () => {
      const { data, error } = await supabase.functions.invoke('job-group-xml-feed', {
        body: { jobGroupId }
      });

      if (error) throw error;
      return data;
    }, 'getJobGroupXMLFeed');
  }
}

export const jobGroupsService = new JobGroupsService();