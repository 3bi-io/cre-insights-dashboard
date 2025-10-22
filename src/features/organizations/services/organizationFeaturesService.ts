import { supabase } from '@/integrations/supabase/client';
import {
  OrganizationFeature,
  OrganizationFeaturesMap,
  FeatureUpdatePayload,
  FeatureKey,
} from '../types/features.types';
import { isValidFeatureKey } from '../config/organizationFeatures.config';

/**
 * Service layer for organization feature operations
 * Centralizes all feature-related database operations
 */
export class OrganizationFeaturesService {
  /**
   * Fetch all features for an organization
   */
  static async fetchOrganizationFeatures(organizationId: string): Promise<OrganizationFeature[]> {
    const { data, error } = await supabase
      .from('organization_features')
      .select('*')
      .eq('organization_id', organizationId)
      .order('feature_name');

    if (error) {
      console.error('Error fetching organization features:', error);
      throw new Error(`Failed to fetch features: ${error.message}`);
    }

    // Filter and type-cast only valid features
    const validFeatures = (data || [])
      .filter(feature => isValidFeatureKey(feature.feature_name))
      .map(feature => ({
        ...feature,
        feature_name: feature.feature_name as FeatureKey,
        settings: feature.settings as Record<string, any> | undefined,
      }));

    return validFeatures;
  }

  /**
   * Fetch features as a map for quick lookups
   */
  static async fetchOrganizationFeaturesMap(
    organizationId: string
  ): Promise<OrganizationFeaturesMap> {
    const features = await this.fetchOrganizationFeatures(organizationId);

    return features.reduce((acc, feature) => {
      if (isValidFeatureKey(feature.feature_name)) {
        acc[feature.feature_name] = feature.enabled;
      }
      return acc;
    }, {} as OrganizationFeaturesMap);
  }

  /**
   * Update organization features using RPC function
   */
  static async updateOrganizationFeatures(
    organizationId: string,
    features: FeatureUpdatePayload
  ): Promise<void> {
    // Validate all feature keys before updating
    const invalidKeys = Object.keys(features).filter(key => !isValidFeatureKey(key));
    if (invalidKeys.length > 0) {
      throw new Error(`Invalid feature keys: ${invalidKeys.join(', ')}`);
    }

    const { error } = await supabase.rpc('update_organization_features', {
      _org_id: organizationId,
      _features: features,
    });

    if (error) {
      console.error('Error updating organization features:', error);
      throw new Error(`Failed to update features: ${error.message}`);
    }
  }

  /**
   * Check if organization has a specific feature enabled
   */
  static async hasFeatureEnabled(
    organizationId: string,
    featureKey: FeatureKey
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from('organization_features')
      .select('enabled')
      .eq('organization_id', organizationId)
      .eq('feature_name', featureKey)
      .single();

    if (error) {
      // If no record found, feature is disabled by default
      if (error.code === 'PGRST116') {
        return false;
      }
      console.error('Error checking feature status:', error);
      return false;
    }

    return data?.enabled || false;
  }

  /**
   * Batch check multiple features
   */
  static async checkMultipleFeatures(
    organizationId: string,
    featureKeys: FeatureKey[]
  ): Promise<Record<FeatureKey, boolean>> {
    const featuresMap = await this.fetchOrganizationFeaturesMap(organizationId);

    return featureKeys.reduce((acc, key) => {
      acc[key] = featuresMap[key] || false;
      return acc;
    }, {} as Record<FeatureKey, boolean>);
  }
}
