import { supabase } from '@/integrations/supabase/client';
import { Platform } from '../types';
import { logger } from '@/lib/logger';

/**
 * Central service for platform CRUD operations
 */
export class PlatformService {
  /**
   * Fetches all platforms
   */
  static async fetchPlatforms(): Promise<Platform[]> {
    logger.debug('Fetching platforms', { context: 'platform-service' });
    
    const { data, error } = await supabase
      .from('platforms')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      logger.error('Error fetching platforms', error, { context: 'platform-service' });
      throw error;
    }
    
    logger.debug('Platforms fetched', { count: data?.length, context: 'platform-service' });
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
    logger.debug('Creating platform', { name: platform.name, context: 'platform-service' });
    
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
      logger.error('Error creating platform', error, { context: 'platform-service' });
      throw error;
    }
    
    logger.debug('Platform created', { id: data.id, context: 'platform-service' });
    return data;
  }

  /**
   * Updates an existing platform
   */
  static async updatePlatform(
    id: string, 
    updates: Partial<Omit<Platform, 'id' | 'created_at'>>
  ): Promise<Platform> {
    logger.debug('Updating platform', { id, context: 'platform-service' });
    
    const { data, error } = await supabase
      .from('platforms')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      logger.error('Error updating platform', error, { id, context: 'platform-service' });
      throw error;
    }
    
    logger.debug('Platform updated', { id: data.id, context: 'platform-service' });
    return data;
  }

  /**
   * Deletes a platform
   */
  static async deletePlatform(id: string): Promise<void> {
    logger.debug('Deleting platform', { id, context: 'platform-service' });
    
    const { error } = await supabase
      .from('platforms')
      .delete()
      .eq('id', id);
    
    if (error) {
      logger.error('Error deleting platform', error, { id, context: 'platform-service' });
      throw error;
    }
    
    logger.debug('Platform deleted', { id, context: 'platform-service' });
  }
}
