import { supabase } from '@/integrations/supabase/client';
import {
  OrganizationPlatformAccess,
  OrganizationPlatformsMap,
  PlatformUpdatePayload,
  PlatformKey,
} from '../types/platforms.types';
import { isValidPlatformKey } from '../config/organizationPlatforms.config';
import { logger } from '@/lib/logger';

/**
 * Service layer for organization platform operations
 * Centralizes all platform-related database operations
 */
export class OrganizationPlatformsService {
  /**
   * Fetch all platform access for an organization
   */
  static async fetchOrganizationPlatforms(organizationId: string): Promise<OrganizationPlatformAccess[]> {
    const { data, error } = await supabase.rpc('get_organization_platform_access', {
      _org_id: organizationId,
    });

    if (error) {
      logger.error('Error fetching organization platforms', error, { organizationId });
      throw new Error(`Failed to fetch platforms: ${error.message}`);
    }

    // Filter and type-cast only valid platforms
    const validPlatforms = (data || [])
      .filter((platform: any) => isValidPlatformKey(platform.platform_name))
      .map((platform: any) => ({
        id: platform.id || '',
        organization_id: organizationId,
        platform_name: platform.platform_name as PlatformKey,
        enabled: platform.enabled,
        created_at: platform.created_at || new Date().toISOString(),
        updated_at: platform.updated_at || new Date().toISOString(),
      }));

    return validPlatforms;
  }

  /**
   * Fetch platforms as a map for quick lookups
   */
  static async fetchOrganizationPlatformsMap(
    organizationId: string
  ): Promise<OrganizationPlatformsMap> {
    const platforms = await this.fetchOrganizationPlatforms(organizationId);

    return platforms.reduce((acc, platform) => {
      if (isValidPlatformKey(platform.platform_name)) {
        acc[platform.platform_name] = platform.enabled;
      }
      return acc;
    }, {} as OrganizationPlatformsMap);
  }

  /**
   * Update organization platforms - batch update
   */
  static async updateOrganizationPlatforms(
    organizationId: string,
    platforms: PlatformUpdatePayload
  ): Promise<void> {
    // Validate all platform keys before updating
    const invalidKeys = Object.keys(platforms).filter(key => !isValidPlatformKey(key));
    if (invalidKeys.length > 0) {
      throw new Error(`Invalid platform keys: ${invalidKeys.join(', ')}`);
    }

    // Update platforms one by one (no batch RPC available)
    const updates = Object.entries(platforms).map(([platformName, config]) =>
      this.setPlatformAccess(organizationId, platformName as PlatformKey, config.enabled)
    );

    await Promise.all(updates);
  }

  /**
   * Set platform access for a single platform
   */
  static async setPlatformAccess(
    organizationId: string,
    platformKey: PlatformKey,
    enabled: boolean
  ): Promise<void> {
    if (!isValidPlatformKey(platformKey)) {
      throw new Error(`Invalid platform key: ${platformKey}`);
    }

    const { error } = await supabase.rpc('set_organization_platform_access', {
      _org_id: organizationId,
      _platform_name: platformKey,
      _enabled: enabled,
    });

    if (error) {
      logger.error('Error setting platform access', error, { organizationId, platformKey });
      throw new Error(`Failed to set platform access: ${error.message}`);
    }
  }

  /**
   * Check if organization has a specific platform enabled
   */
  static async hasPlatformEnabled(
    organizationId: string,
    platformKey: PlatformKey
  ): Promise<boolean> {
    const { data, error } = await supabase.rpc('organization_has_platform_access', {
      _org_id: organizationId,
      _platform_name: platformKey,
    });

    if (error) {
      logger.error('Error checking platform access', error, { organizationId, platformKey });
      return false;
    }

    return data || false;
  }

  /**
   * Batch check multiple platforms
   */
  static async checkMultiplePlatforms(
    organizationId: string,
    platformKeys: PlatformKey[]
  ): Promise<Record<PlatformKey, boolean>> {
    const platformsMap = await this.fetchOrganizationPlatformsMap(organizationId);

    return platformKeys.reduce((acc, key) => {
      acc[key] = platformsMap[key] || false;
      return acc;
    }, {} as Record<PlatformKey, boolean>);
  }
}
