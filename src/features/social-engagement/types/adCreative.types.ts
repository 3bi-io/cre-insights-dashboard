// Types for Ad Creative Studio

import type { JobType, BenefitId, AspectRatio, MediaType, SocialBeaconPlatform } from '../config/socialBeacons.config';

/**
 * Configuration for generating an ad creative
 */
export interface AdCreativeConfig {
  jobType: JobType;
  benefits: BenefitId[];
  companyName?: string;
  location?: string;
  salaryRange?: string;
  customPrompt?: string;
  mediaType: MediaType;
  aspectRatio: AspectRatio;
  targetPlatforms: SocialBeaconPlatform[];
}

/**
 * Generated ad creative content
 */
export interface GeneratedAdContent {
  headline: string;
  body: string;
  hashtags: string[];
  callToAction?: string;
}

/**
 * Complete generated ad creative with metadata
 */
export interface GeneratedAd {
  id?: string;
  config: AdCreativeConfig;
  content: GeneratedAdContent;
  mediaUrl?: string;
  thumbnailUrl?: string;
  generatedAt: string;
  status: 'draft' | 'ready' | 'published' | 'failed';
}

/**
 * Platform-specific ad preview data
 */
export interface PlatformAdPreview {
  platform: SocialBeaconPlatform;
  formattedContent: string;
  characterCount: number;
  isWithinLimit: boolean;
  warnings?: string[];
}

/**
 * Ad creative database record
 */
export interface AdCreativeRecord {
  id: string;
  organization_id: string | null;
  created_by: string | null;
  job_type: string;
  benefits: string[];
  headline: string;
  body: string;
  hashtags: string[];
  media_url: string | null;
  media_type: string | null;
  aspect_ratio: string;
  platforms_published: string[];
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Social beacon configuration database record
 */
export interface SocialBeaconConfigRecord {
  id: string;
  platform: SocialBeaconPlatform;
  organization_id: string | null;
  oauth_client_id: string | null;
  oauth_redirect_uri: string | null;
  oauth_scopes: string[] | null;
  webhook_url: string | null;
  webhook_secret: string | null;
  webhook_verified_at: string | null;
  auto_engage_enabled: boolean;
  ad_creative_enabled: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

/**
 * Platform connection status
 */
export interface PlatformConnectionStatus {
  platform: SocialBeaconPlatform;
  isConnected: boolean;
  configuredSecrets: string[];
  missingSecrets: string[];
  lastVerified?: string;
  error?: string;
}

/**
 * Ad creative generation request payload
 */
export interface GenerateAdCreativeRequest {
  jobType: JobType;
  benefits: BenefitId[];
  companyName?: string;
  location?: string;
  salaryRange?: string;
  customPrompt?: string;
  generateImage?: boolean;
  aspectRatio?: AspectRatio;
}

/**
 * Ad creative generation response
 */
export interface GenerateAdCreativeResponse {
  success: boolean;
  content?: GeneratedAdContent;
  mediaUrl?: string;
  error?: string;
}
