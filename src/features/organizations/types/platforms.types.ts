// Organization platform types and constants

/**
 * All available platform keys in the system
 */
export type PlatformKey =
  | 'google-jobs'
  | 'indeed'
  | 'meta'
  | 'craigslist'
  | 'simplyhired'
  | 'glassdoor'
  | 'truck-driver-jobs-411'
  | 'newjobs4you'
  | 'roadwarriors'
  | 'ats_explorer'
  | 'import_applications'
  | 'adzuna'
  | 'talroo'
  | 'doublenickel'
  | 'jooble'
  | 'talent'
  | 'careerjet'
  | 'jobrapido';

/**
 * Platform category for grouping
 */
export type PlatformCategory = 
  | 'General Platforms'
  | 'Social Media Platforms'
  | 'Classifieds Platforms'
  | 'Reviews Platforms'
  | 'Trucking Platforms'
  | 'Transportation Platforms'
  | 'Admin Tools';

/**
 * Individual platform configuration
 */
export interface PlatformConfig {
  key: PlatformKey;
  name: string;
  description: string;
  category: PlatformCategory;
  icon: string;
  premium?: boolean;
  adminOnly?: boolean;
}

/**
 * Organization platform access record (from database)
 */
export interface OrganizationPlatformAccess {
  id: string;
  organization_id: string;
  platform_name: PlatformKey;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Platform access map for quick lookups
 */
export type OrganizationPlatformsMap = Partial<Record<PlatformKey, boolean>>;

/**
 * Platform update payload for mutations
 */
export interface PlatformUpdatePayload {
  [platformName: string]: {
    enabled: boolean;
  };
}

/**
 * Platform access check result
 */
export interface PlatformAccessResult {
  hasAccess: boolean;
  reason?: 'enabled' | 'super_admin' | 'disabled' | 'not_found';
}
