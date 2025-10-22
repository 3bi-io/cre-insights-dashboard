// Organization Features Module
// Centralized exports for organization feature management

// Types
export type {
  FeatureKey,
  FeatureCategory,
  FeatureConfig,
  OrganizationFeature,
  OrganizationFeaturesMap,
  FeatureUpdatePayload,
  FeatureAccessResult,
} from './types/features.types';

// Configuration
export {
  ORGANIZATION_FEATURES,
  getAllFeatures,
  getFeaturesByCategory,
  getFeatureConfig,
  isValidFeatureKey,
  getFeatureIcon,
  getCategoryColor,
} from './config/organizationFeatures.config';

// Services
export { OrganizationFeaturesService } from './services/organizationFeaturesService';
