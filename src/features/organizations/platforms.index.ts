// Organization Platforms Module
// Centralized exports for organization platform management

// Types
export type {
  PlatformKey,
  PlatformCategory,
  PlatformConfig,
  OrganizationPlatformAccess,
  OrganizationPlatformsMap,
  PlatformUpdatePayload,
  PlatformAccessResult,
} from './types/platforms.types';

// Configuration
export {
  ORGANIZATION_PLATFORMS,
  getAllPlatforms,
  getPlatformsByCategory,
  getPlatformConfig,
  isValidPlatformKey,
  getPlatformIcon,
  getCategoryColor,
} from './config/organizationPlatforms.config';

// Services
export { OrganizationPlatformsService } from './services/organizationPlatformsService';
