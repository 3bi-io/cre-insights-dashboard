import { supabase } from '@/integrations/supabase/client';
import { Organization, OrganizationFormData, OrganizationUpdatePayload } from '../types';

/**
 * Central service for organization CRUD operations
 */
export class OrganizationService {
  /**
   * Fetches all organizations
   */
  static async fetchOrganizations(): Promise<Organization[]> {
    console.log('OrganizationService: Fetching organizations');
    
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('OrganizationService: Error fetching organizations', error);
      throw error;
    }
    
    console.log('OrganizationService: Organizations fetched', data?.length);
    return (data || []) as Organization[];
  }

  /**
   * Fetches a single organization by ID
   */
  static async fetchOrganization(id: string): Promise<Organization> {
    console.log('OrganizationService: Fetching organization', id);
    
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('OrganizationService: Error fetching organization', error);
      throw error;
    }
    
    return data as Organization;
  }

  /**
   * Creates a new organization
   */
  static async createOrganization(formData: OrganizationFormData): Promise<Organization> {
    console.log('OrganizationService: Creating organization', formData.name);
    
    // Call the database function to create organization with admin
    const { data, error } = await supabase.rpc('create_organization', {
      _name: formData.name,
      _slug: formData.slug,
      _admin_email: formData.adminEmail || null,
    });
    
    if (error) {
      console.error('OrganizationService: Error creating organization', error);
      throw error;
    }
    
    // Fetch the created organization
    return this.fetchOrganization(data);
  }

  /**
   * Updates an existing organization
   */
  static async updateOrganization(
    id: string,
    updates: OrganizationUpdatePayload
  ): Promise<Organization> {
    console.log('OrganizationService: Updating organization', id);
    
    const { data, error } = await supabase
      .from('organizations')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('OrganizationService: Error updating organization', error);
      throw error;
    }
    
    console.log('OrganizationService: Organization updated', data.id);
    return data as Organization;
  }

  /**
   * Deletes an organization
   */
  static async deleteOrganization(id: string): Promise<void> {
    console.log('OrganizationService: Deleting organization', id);
    
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('OrganizationService: Error deleting organization', error);
      throw error;
    }
    
    console.log('OrganizationService: Organization deleted', id);
  }

  /**
   * Fetches organization with statistics
   */
  static async fetchOrganizationWithStats(id: string): Promise<any> {
    console.log('OrganizationService: Fetching organization with stats', id);
    
    const { data, error } = await supabase.rpc('get_organization_with_stats', {
      _org_id: id,
    });
    
    if (error) {
      console.error('OrganizationService: Error fetching org stats', error);
      throw error;
    }
    
    return data;
  }

  /**
   * Updates organization features
   */
  static async updateOrganizationFeatures(
    organizationId: string,
    features: Record<string, any>
  ): Promise<void> {
    console.log('OrganizationService: Updating org features', organizationId);
    
    const { error } = await supabase.rpc('update_organization_features', {
      _org_id: organizationId,
      _features: features,
    });
    
    if (error) {
      console.error('OrganizationService: Error updating features', error);
      throw error;
    }
    
    console.log('OrganizationService: Features updated');
  }

  /**
   * Fetches organization platform access
   */
  static async fetchOrganizationPlatformAccess(organizationId: string): Promise<any[]> {
    console.log('OrganizationService: Fetching platform access', organizationId);
    
    const { data, error } = await supabase.rpc('get_organization_platform_access', {
      _org_id: organizationId,
    });
    
    if (error) {
      console.error('OrganizationService: Error fetching platform access', error);
      throw error;
    }
    
    return data || [];
  }

  /**
   * Sets organization platform access
   */
  static async setOrganizationPlatformAccess(
    organizationId: string,
    platformName: string,
    enabled: boolean
  ): Promise<void> {
    console.log('OrganizationService: Setting platform access', organizationId, platformName, enabled);
    
    const { error } = await supabase.rpc('set_organization_platform_access', {
      _org_id: organizationId,
      _platform_name: platformName,
      _enabled: enabled,
    });
    
    if (error) {
      console.error('OrganizationService: Error setting platform access', error);
      throw error;
    }
    
    console.log('OrganizationService: Platform access updated');
  }
}
