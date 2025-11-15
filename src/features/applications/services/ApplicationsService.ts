import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { BaseFeatureService } from '@/features/shared/services/BaseFeatureService';
import { ApiResponse, FilterOptions } from '@/features/shared/types/feature.types';
import { createCrudValidation, commonSchemas } from '@/features/shared/utils/featureValidation';

// Application data schema
const applicationSchema = z.object({
  id: commonSchemas.id.optional(),
  organization_id: commonSchemas.organizationId,
  job_listing_id: commonSchemas.id,
  first_name: z.string().min(1, 'First name is required').max(100, 'First name too long'),
  last_name: z.string().min(1, 'Last name is required').max(100, 'Last name too long'),
  email: commonSchemas.email,
  phone: commonSchemas.phone.optional(),
  address: z.string().max(500, 'Address too long').optional(),
  city: z.string().max(100, 'City name too long').optional(),
  state: z.string().max(50, 'State name too long').optional(),
  zip_code: z.string().max(20, 'Zip code too long').optional(),
  experience_years: z.number().min(0, 'Experience cannot be negative').optional(),
  cdl_license: z.boolean().optional(),
  veteran_status: z.boolean().optional(),
  resume_url: commonSchemas.url.optional(),
  cover_letter: z.string().max(2000, 'Cover letter too long').optional(),
  status: z.enum(['pending', 'reviewed', 'interviewing', 'hired', 'rejected'], {
    errorMap: () => ({ message: 'Invalid application status' })
  }),
  applied_at: commonSchemas.date.optional(),
  reviewed_at: commonSchemas.date.optional(),
  notes: z.string().max(1000, 'Notes too long').optional()
});

export type Application = z.infer<typeof applicationSchema>;
export type CreateApplicationData = Omit<Application, 'id' | 'applied_at' | 'reviewed_at'>;
export type UpdateApplicationData = Partial<Omit<CreateApplicationData, 'organization_id' | 'job_listing_id'> & { 
  status: Application['status']; 
  reviewed_at?: string;
}>;

// Re-export the service instance as default
export { applicationsService as default };

class ApplicationsService extends BaseFeatureService {
  private validation = createCrudValidation(
    applicationSchema,
    applicationSchema.partial(),
    'Applications'
  );

  constructor() {
    super('applications', 'Applications');
  }

  async getApplications(filters?: FilterOptions & {
    job_id?: string;
    status?: string;
    cdl_license?: boolean;
    veteran_status?: boolean;
    experience_years_min?: number;
    city?: string;
    state?: string;
    organization_id?: string;
    accessReason?: string;
  }): Promise<ApiResponse<any>> {
    return this.handleApiCall(async () => {
      // Build filters object for RPC function
      const rpcFilters: Record<string, any> = {};
      
      if (filters?.job_id) rpcFilters.job_id = filters.job_id;
      if (filters?.status) rpcFilters.status = filters.status;
      if (filters?.city) rpcFilters.city = filters.city;
      if (filters?.state) rpcFilters.state = filters.state;
      if (filters?.search) rpcFilters.search = filters.search;
      
      // Pagination
      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || 200;
      rpcFilters.limit = pageSize;
      rpcFilters.offset = (page - 1) * pageSize;

      // Use audited RPC function with access reason
      const accessReason = filters?.accessReason || 'Application list review';
      
      const { data, error } = await supabase.rpc('get_applications_list_with_audit', {
        filters: rpcFilters,
        access_reason: accessReason
      });

      if (error) {
        console.error('Error fetching applications:', error);
        return { data: null, error: error.message };
      }

      // Extract total count from first row (all rows have same total_count)
      const totalCount = data && data.length > 0 ? data[0].total_count : 0;
      
      // Remove total_count from individual rows
      const cleanData = data?.map(({ total_count, ...rest }) => rest) || [];
      
      const hasMore = rpcFilters.offset + pageSize < totalCount;

      return {
        data: {
          data: cleanData,
          totalCount,
          page,
          pageSize,
          hasMore
        },
        error: null
      };
    }, 'getApplications');
  }

  async createApplication(
    data: CreateApplicationData, 
    accessReason: string = 'New application submission'
  ): Promise<ApiResponse<Application>> {
    return this.handleApiCall(async () => {
      // Use audited RPC function for creation
      const { data: result, error } = await supabase.rpc('create_application_with_audit', {
        application_data: data,
        created_by_reason: accessReason
      });

      if (error) {
        console.error('Error creating application:', error);
        return { data: null, error: error.message };
      }

      return { data: result as Application, error: null };
    }, 'createApplication');
  }

  async updateApplication(
    id: string, 
    data: UpdateApplicationData,
    accessReason: string = 'Application update'
  ): Promise<ApiResponse<Application>> {
    return this.handleApiCall(async () => {
      const idValidation = this.validation.validateId(id);
      if (idValidation.error) {
        return { data: null, error: idValidation.error };
      }

      // Use audited RPC function for updates
      const { data: result, error } = await supabase.rpc('update_application_with_audit', {
        application_id: id,
        update_data: data,
        update_reason: accessReason
      });

      if (error) {
        console.error('Error updating application:', error);
        return { data: null, error: error.message };
      }

      return { data: result as Application, error: null };
    }, 'updateApplication');
  }

  async deleteApplication(id: string): Promise<ApiResponse<void>> {
    const validation = this.validation.validateId(id);
    if (validation.error) {
      return { data: null, error: validation.error };
    }

    return this.delete(id);
  }

  async getApplicationById(
    id: string, 
    includePII: boolean = false,
    accessReason: string = 'Application detail view'
  ): Promise<ApiResponse<Application>> {
    return this.handleApiCall(async () => {
      const validation = this.validation.validateId(id);
      if (validation.error) {
        return { data: null, error: validation.error };
      }

      // Use audited RPC function
      const { data: result, error } = await supabase.rpc('get_application_with_audit', {
        application_id: id,
        access_reason: accessReason,
        include_pii: includePII
      });

      if (error) {
        console.error('Error fetching application:', error);
        return { data: null, error: error.message };
      }

      return { data: result as Application, error: null };
    }, 'getApplicationById');
  }

  // Custom business logic methods
  async reviewApplication(
    id: string, 
    status: 'reviewed' | 'interviewing' | 'hired' | 'rejected', 
    notes?: string
  ): Promise<ApiResponse<Application>> {
    return this.updateApplication(
      id, 
      { status, notes },
      `Application review: status changed to ${status}`
    );
  }

  async getApplicationStats(jobId?: string): Promise<ApiResponse<{
    total: number;
    byStatus: Record<string, number>;
    byCdl: { withCdl: number; withoutCdl: number };
    byVeteran: { veteran: number; nonVeteran: number };
  }>> {
    return this.handleApiCall(async () => {
      let query = (supabase as any).from(this.tableName).select('status, cdl_license, veteran_status');
      
      if (jobId) {
        query = query.eq('job_listing_id', jobId);
      }

      const result = await query;
      if (result.error) return result;

      const applications = result.data;
      const stats = {
        total: applications.length,
        byStatus: applications.reduce((acc: Record<string, number>, app: any) => {
          acc[app.status] = (acc[app.status] || 0) + 1;
          return acc;
        }, {}),
        byCdl: {
          withCdl: applications.filter((app: any) => app.cdl_license).length,
          withoutCdl: applications.filter((app: any) => !app.cdl_license).length
        },
        byVeteran: {
          veteran: applications.filter((app: any) => app.veteran_status).length,
          nonVeteran: applications.filter((app: any) => !app.veteran_status).length
        }
      };

      return { data: stats, error: null };
    }, 'getApplicationStats');
  }

}

export const applicationsService = new ApplicationsService();