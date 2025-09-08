import { z } from 'zod';
import { BaseFeatureService } from '@/features/shared/services/BaseFeatureService';
import { ApiResponse, FilterOptions } from '@/features/shared/types/feature.types';
import { createCrudValidation, commonSchemas } from '@/features/shared/utils/featureValidation';

// Application data schema
const applicationSchema = z.object({
  id: commonSchemas.id.optional(),
  organization_id: commonSchemas.organizationId,
  job_id: commonSchemas.id,
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
export type UpdateApplicationData = Partial<Omit<CreateApplicationData, 'organization_id' | 'job_id'> & { 
  status: Application['status']; 
  reviewed_at?: string;
}>;

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
  }): Promise<ApiResponse<any>> {
    return this.handleApiCall(async () => {
      let query = (this.supabase as any).from(this.tableName)
        .select(`
          *,
          job_listings:job_id (
            title,
            location,
            employment_type
          )
        `, { count: 'exact' })
        .order('applied_at', { ascending: false });

      // Apply application-specific filters
      if (filters?.job_id) {
        query = query.eq('job_id', filters.job_id);
      }
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.cdl_license !== undefined) {
        query = query.eq('cdl_license', filters.cdl_license);
      }
      
      if (filters?.veteran_status !== undefined) {
        query = query.eq('veteran_status', filters.veteran_status);
      }
      
      if (filters?.experience_years_min !== undefined) {
        query = query.gte('experience_years', filters.experience_years_min);
      }
      
      if (filters?.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }
      
      if (filters?.state) {
        query = query.eq('state', filters.state);
      }

      // Apply search to name and email
      if (filters?.search && filters.search.length > 0) {
        query = query.or(
          `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
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
    }, 'getApplications');
  }

  async createApplication(data: CreateApplicationData): Promise<ApiResponse<Application>> {
    const validation = this.validation.validateCreate(data);
    if (validation.error) {
      return validation;
    }

    // Add applied_at timestamp
    const applicationData = {
      ...validation.data,
      applied_at: new Date().toISOString()
    };

    return this.create<Application>(applicationData);
  }

  async updateApplication(id: string, data: UpdateApplicationData): Promise<ApiResponse<Application>> {
    const idValidation = this.validation.validateId(id);
    if (idValidation.error) {
      return idValidation;
    }

    const dataValidation = this.validation.validateUpdate(data);
    if (dataValidation.error) {
      return dataValidation;
    }

    // Add reviewed_at timestamp if status is being updated
    let updateData = dataValidation.data;
    if (data.status && data.status !== 'pending') {
      updateData = {
        ...updateData,
        reviewed_at: new Date().toISOString()
      };
    }

    return this.update<Application>(id, updateData);
  }

  async deleteApplication(id: string): Promise<ApiResponse<void>> {
    const validation = this.validation.validateId(id);
    if (validation.error) {
      return validation;
    }

    return this.delete(id);
  }

  async getApplicationById(id: string): Promise<ApiResponse<Application>> {
    const validation = this.validation.validateId(id);
    if (validation.error) {
      return validation;
    }

    return this.getById<Application>(id);
  }

  // Custom business logic methods
  async reviewApplication(id: string, status: 'reviewed' | 'interviewing' | 'hired' | 'rejected', notes?: string): Promise<ApiResponse<Application>> {
    return this.updateApplication(id, { 
      status,
      notes,
      reviewed_at: new Date().toISOString()
    });
  }

  async getApplicationStats(jobId?: string): Promise<ApiResponse<{
    total: number;
    byStatus: Record<string, number>;
    byCdl: { withCdl: number; withoutCdl: number };
    byVeteran: { veteran: number; nonVeteran: number };
  }>> {
    return this.handleApiCall(async () => {
      let query = (this.supabase as any).from(this.tableName).select('status, cdl_license, veteran_status');
      
      if (jobId) {
        query = query.eq('job_id', jobId);
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

  private get supabase() {
    return (this as any).supabase || require('@/integrations/supabase/client').supabase;
  }
}

export const applicationsService = new ApplicationsService();