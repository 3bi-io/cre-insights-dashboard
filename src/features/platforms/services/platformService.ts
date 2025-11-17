import { supabase } from '@/integrations/supabase/client';
import { Platform } from '../types';

/**
 * Central service for platform CRUD operations
 */
export class PlatformService {
  /**
   * Fetches all platforms
   */
  static async fetchPlatforms(): Promise<Platform[]> {
    const { data, error } = await supabase
      .from('platforms')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('PlatformService: Error fetching platforms', error);
      throw error;
    }
    
    return data || [];
  }

  /**
   * Creates a new platform
   */
  static async createPlatform(platform: {
    name: string;
    logo_url?: string | null;
    api_endpoint?: string | null;
    organization_id?: string;
  }): Promise<Platform> {
    console.log('PlatformService: Creating platform', platform.name);
    
    const { data, error } = await supabase
      .from('platforms')
      .insert({
        name: platform.name.trim(),
        logo_url: platform.logo_url?.trim() || null,
        api_endpoint: platform.api_endpoint?.trim() || null,
        organization_id: platform.organization_id,
      })
      .select()
      .single();
    
    if (error) {
      console.error('PlatformService: Error creating platform', error);
      throw error;
    }
    
    console.log('PlatformService: Platform created', data.id);
    return data;
  }

  /**
   * Updates an existing platform
   */
  static async updatePlatform(
    id: string, 
    updates: Partial<Omit<Platform, 'id' | 'created_at'>>
  ): Promise<Platform> {
    const { data, error } = await supabase
      .from('platforms')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('PlatformService: Error updating platform', error);
      throw error;
    }
    
    return data;
  }

  /**
   * Deletes a platform
   */
  static async deletePlatform(id: string): Promise<void> {
    const { error } = await supabase
      .from('platforms')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('PlatformService: Error deleting platform', error);
      throw error;
    }
  }
}
