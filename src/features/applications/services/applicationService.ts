import { supabase } from '@/integrations/supabase/client';
import { Application, ApplicationFormData, ApplicationUpdatePayload } from '../types';

/**
 * Central service for application CRUD operations
 */
export class ApplicationService {
  /**
   * Fetches all applications with relationships
   */
  static async fetchApplications(): Promise<Application[]> {
    console.log('ApplicationService: Fetching applications');
    
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        job_listings (
          title,
          job_title,
          organization_id,
          clients (
            name
          )
        ),
        recruiters (
          first_name,
          last_name
        )
      `)
      .order('applied_at', { ascending: false });
    
    if (error) {
      console.error('ApplicationService: Error fetching applications', error);
      throw error;
    }
    
    console.log('ApplicationService: Applications fetched', data?.length);
    return (data as Application[]) || [];
  }

  /**
   * Fetches a single application by ID
   */
  static async fetchApplication(id: string): Promise<Application> {
    console.log('ApplicationService: Fetching application', id);
    
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        job_listings (
          title,
          job_title,
          organization_id,
          clients (
            name
          )
        ),
        recruiters (
          first_name,
          last_name
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('ApplicationService: Error fetching application', error);
      throw error;
    }
    
    return data as Application;
  }

  /**
   * Creates a new application
   */
  static async createApplication(formData: ApplicationFormData): Promise<Application> {
    console.log('ApplicationService: Creating application');
    
    const { data, error } = await supabase
      .from('applications')
      .insert({
        ...formData,
        status: 'pending',
        applied_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      console.error('ApplicationService: Error creating application', error);
      throw error;
    }
    
    console.log('ApplicationService: Application created', data.id);
    return data as Application;
  }

  /**
   * Updates an existing application
   */
  static async updateApplication(
    id: string,
    updates: ApplicationUpdatePayload
  ): Promise<Application> {
    console.log('ApplicationService: Updating application', id);
    
    const { data, error } = await supabase
      .from('applications')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('ApplicationService: Error updating application', error);
      throw error;
    }
    
    console.log('ApplicationService: Application updated', data.id);
    return data as Application;
  }

  /**
   * Updates application status
   */
  static async updateStatus(id: string, status: string): Promise<void> {
    console.log('ApplicationService: Updating status', id, status);
    await this.updateApplication(id, { status: status as any });
  }

  /**
   * Assigns a recruiter to an application
   */
  static async assignRecruiter(id: string, recruiterId: string | null): Promise<void> {
    console.log('ApplicationService: Assigning recruiter', id, recruiterId);
    await this.updateApplication(id, { recruiter_id: recruiterId });
  }

  /**
   * Deletes an application
   */
  static async deleteApplication(id: string): Promise<void> {
    console.log('ApplicationService: Deleting application', id);
    
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('ApplicationService: Error deleting application', error);
      throw error;
    }
    
    console.log('ApplicationService: Application deleted', id);
  }

  /**
   * Fetches applications for a specific job listing
   */
  static async fetchApplicationsByJob(jobListingId: string): Promise<Application[]> {
    console.log('ApplicationService: Fetching applications for job', jobListingId);
    
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        job_listings (
          title,
          job_title
        ),
        recruiters (
          first_name,
          last_name
        )
      `)
      .eq('job_listing_id', jobListingId)
      .order('applied_at', { ascending: false });
    
    if (error) {
      console.error('ApplicationService: Error fetching applications by job', error);
      throw error;
    }
    
    return (data as Application[]) || [];
  }
}
