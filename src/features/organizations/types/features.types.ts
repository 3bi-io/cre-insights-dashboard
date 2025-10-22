// Organization feature types and constants

/**
 * All available feature keys in the system
 */
export type FeatureKey =
  | 'meta_integration'
  | 'openai_access'
  | 'anthropic_access'
  | 'grok_access'
  | 'tenstreet_access'
  | 'voice_agent'
  | 'elevenlabs_access'
  | 'advanced_analytics';

/**
 * Feature category for grouping
 */
export type FeatureCategory = 'AI' | 'Advertising' | 'Integration' | 'Analytics';

/**
 * Individual feature configuration
 */
export interface FeatureConfig {
  key: FeatureKey;
  name: string;
  label: string;
  description: string;
  category: FeatureCategory;
  premium?: boolean;
  requiresSubscription?: boolean;
}

/**
 * Organization features record (from database)
 */
export interface OrganizationFeature {
  id: string;
  organization_id: string;
  feature_name: FeatureKey;
  enabled: boolean;
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Feature status map for quick lookups
 */
export type OrganizationFeaturesMap = Partial<Record<FeatureKey, boolean>>;

/**
 * Feature update payload for mutations
 */
export interface FeatureUpdatePayload {
  [featureName: string]: {
    enabled: boolean;
    settings?: Record<string, any>;
  };
}

/**
 * Feature access check result
 */
export interface FeatureAccessResult {
  hasAccess: boolean;
  reason?: 'enabled' | 'super_admin' | 'disabled' | 'not_found';
}
