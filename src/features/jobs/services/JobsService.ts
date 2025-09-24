import { z } from 'zod';
import { BaseFeatureService } from '@/features/shared/services/BaseFeatureService';
import { ApiResponse, FilterOptions } from '@/features/shared/types/feature.types';
import { createCrudValidation, commonSchemas } from '@/features/shared/utils/featureValidation';

// Job data schema
const jobSchema = z.object({
  id: commonSchemas.id.optional(),
  organization_id: commonSchemas.organizationId,
  title: z.string().min(1, 'Job title is required').max(200, 'Title too long'),
  description: z.string().min(1, 'Description is required'),
  location: z.string().min(1, 'Location is required'),
  salary_min: z.number().positive('Minimum salary must be positive').optional(),
  salary_max: z.number().positive('Maximum salary must be positive').optional(),
  employment_type: z.enum(['full_time', 'part_time', 'contract', 'temporary'], {
    errorMap: () => ({ message: 'Invalid employment type' })
  }),
  status: commonSchemas.status,
  requirements: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  remote_allowed: z.boolean().optional(),
  experience_level: z.enum(['entry', 'mid', 'senior', 'executive']).optional(),
  posted_at: commonSchemas.date.optional(),
  expires_at: commonSchemas.date.optional()
});

export type Job = z.infer<typeof jobSchema>;
export type CreateJobData = Omit<Job, 'id'>;
export type UpdateJobData = Partial<Omit<Job, 'id' | 'organization_id'>>;

class JobsService extends BaseFeatureService {
  private validation = createCrudValidation(
    jobSchema,
    jobSchema.partial(),
    'Jobs'
  );

  constructor() {
    super('job_listings', 'Jobs');
  }

  async getJobs(filters?: FilterOptions & { 
    location?: string;
    employment_type?: string;
    remote_allowed?: boolean;
    experience_level?: string;
  }): Promise<ApiResponse<any>> {
    return this.handleApiCall(async () => {
      let query = (this.supabase as any).from(this.tableName)
        .select('*, organizations:organization_id(name, slug)', { count: 'exact' })
        .order('posted_at', { ascending: false });

      // Apply job-specific filters
      if (filters?.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }
      
      if (filters?.employment_type) {
        query = query.eq('employment_type', filters.employment_type);
      }
      
      if (filters?.remote_allowed !== undefined) {
        query = query.eq('remote_allowed', filters.remote_allowed);
      }
      
      if (filters?.experience_level) {
        query = query.eq('experience_level', filters.experience_level);
      }

      // Apply search to title and description
      if (filters?.search && filters.search.length > 0) {
        query = query.or(
          `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        );
      }

      // Apply pagination
      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || 10;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      query = query.range(from, to);

      const result = await query;
      
      if (result.error) return result;

      const totalCount = result.count || 0;
      const hasMore = to < totalCount - 1;

      return {
        data: {
          data: result.data,
          totalCount,
          page,
          pageSize,
          hasMore
        },
        error: null
      };
    }, 'getJobs');
  }

  async createJob(data: CreateJobData): Promise<ApiResponse<Job>> {
    const validation = this.validation.validateCreate(data);
    if (validation.error) {
      return { data: null, error: validation.error };
    }

    return this.create<Job>(validation.data);
  }

  async updateJob(id: string, data: UpdateJobData): Promise<ApiResponse<Job>> {
    const idValidation = this.validation.validateId(id);
    if (idValidation.error) {
      return { data: null, error: idValidation.error };
    }

    const dataValidation = this.validation.validateUpdate(data);
    if (dataValidation.error) {
      return { data: null, error: dataValidation.error };
    }

    return this.update<Job>(id, dataValidation.data);
  }

  async deleteJob(id: string): Promise<ApiResponse<void>> {
    const validation = this.validation.validateId(id);
    if (validation.error) {
      return { data: null, error: validation.error };
    }

    return this.delete(id);
  }

  async getJobById(id: string): Promise<ApiResponse<Job>> {
    const validation = this.validation.validateId(id);
    if (validation.error) {
      return { data: null, error: validation.error };
    }

    return this.getById<Job>(id);
  }

  // Custom business logic methods
  async duplicateJob(id: string, title: string): Promise<ApiResponse<Job>> {
    const jobResponse = await this.getJobById(id);
    if (jobResponse.error) {
      return jobResponse;
    }

    const originalJob = jobResponse.data;
    const duplicateData: CreateJobData = {
      ...originalJob,
      title: `${title} (Copy)`,
      status: 'inactive' as const,
      expires_at: undefined
    };

    return this.createJob(duplicateData);
  }

  async activateJob(id: string): Promise<ApiResponse<Job>> {
    return this.updateJob(id, { 
      status: 'active' as const
    });
  }

  async deactivateJob(id: string): Promise<ApiResponse<Job>> {
    return this.updateJob(id, { status: 'inactive' as const });
  }

  private get supabase() {
    // Access the supabase instance from parent class
    return (this as any).supabase || require('@/integrations/supabase/client').supabase;
  }
}

export const jobsService = new JobsService();