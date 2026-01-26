// Social Beacon Platform Configuration
// Centralized configuration for all social media platform integrations

import { 
  Twitter, 
  Facebook, 
  Instagram, 
  MessageCircle, 
  Video, 
  MessageSquare,
  type LucideIcon 
} from 'lucide-react';

/**
 * Supported social beacon platforms
 */
export type SocialBeaconPlatform = 
  | 'x' 
  | 'facebook' 
  | 'instagram' 
  | 'whatsapp' 
  | 'tiktok' 
  | 'reddit';

/**
 * Authentication types for platform connections
 */
export type AuthType = 'oauth2' | 'oauth2_pkce' | 'api_key' | 'business_api';

/**
 * Platform configuration interface
 */
export interface SocialBeaconConfig {
  platform: SocialBeaconPlatform;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  authType: AuthType;
  requiredSecrets: string[];
  optionalSecrets?: string[];
  webhookSupported: boolean;
  autoEngageSupported: boolean;
  adCreativeSupported: boolean;
  apiDocUrl?: string;
  characterLimit?: number;
  mediaFormats?: string[];
}

/**
 * Complete platform configurations for all supported social beacons
 */
export const SOCIAL_BEACONS: Record<SocialBeaconPlatform, SocialBeaconConfig> = {
  x: {
    platform: 'x',
    name: 'X (Twitter)',
    description: 'X/Twitter Ads API for job promotion and recruitment marketing',
    icon: Twitter,
    color: 'hsl(var(--foreground))',
    bgColor: 'hsl(var(--muted))',
    authType: 'oauth2_pkce',
    requiredSecrets: [
      'TWITTER_CONSUMER_KEY', 
      'TWITTER_CONSUMER_SECRET', 
      'TWITTER_ACCESS_TOKEN', 
      'TWITTER_ACCESS_TOKEN_SECRET'
    ],
    webhookSupported: true,
    autoEngageSupported: true,
    adCreativeSupported: true,
    apiDocUrl: 'https://developer.x.com/en/docs',
    characterLimit: 280,
    mediaFormats: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'],
  },
  facebook: {
    platform: 'facebook',
    name: 'Facebook',
    description: 'Meta Business Suite for Facebook job ads and page engagement',
    icon: Facebook,
    color: 'hsl(221, 44%, 41%)',
    bgColor: 'hsl(221, 44%, 41%, 0.1)',
    authType: 'oauth2',
    requiredSecrets: ['META_APP_ID', 'META_APP_SECRET', 'META_ACCESS_TOKEN'],
    optionalSecrets: ['META_PAGE_ID'],
    webhookSupported: true,
    autoEngageSupported: true,
    adCreativeSupported: true,
    apiDocUrl: 'https://developers.facebook.com/docs/graph-api',
    characterLimit: 63206,
    mediaFormats: ['image/jpeg', 'image/png', 'video/mp4'],
  },
  instagram: {
    platform: 'instagram',
    name: 'Instagram',
    description: 'Instagram Business for visual job marketing',
    icon: Instagram,
    color: 'hsl(340, 75%, 54%)',
    bgColor: 'hsl(340, 75%, 54%, 0.1)',
    authType: 'oauth2',
    requiredSecrets: ['META_APP_ID', 'META_APP_SECRET'],
    optionalSecrets: ['META_ACCESS_TOKEN'],
    webhookSupported: true,
    autoEngageSupported: true,
    adCreativeSupported: true,
    apiDocUrl: 'https://developers.facebook.com/docs/instagram-api',
    characterLimit: 2200,
    mediaFormats: ['image/jpeg', 'image/png', 'video/mp4'],
  },
  whatsapp: {
    platform: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'WhatsApp Business API for candidate communication',
    icon: MessageCircle,
    color: 'hsl(142, 70%, 45%)',
    bgColor: 'hsl(142, 70%, 45%, 0.1)',
    authType: 'business_api',
    requiredSecrets: ['WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_ACCESS_TOKEN'],
    optionalSecrets: ['WHATSAPP_BUSINESS_ID'],
    webhookSupported: true,
    autoEngageSupported: true,
    adCreativeSupported: false,
    apiDocUrl: 'https://developers.facebook.com/docs/whatsapp',
    characterLimit: 4096,
  },
  tiktok: {
    platform: 'tiktok',
    name: 'TikTok',
    description: 'TikTok for Business API for video job ads',
    icon: Video,
    color: 'hsl(0, 0%, 0%)',
    bgColor: 'hsl(0, 0%, 0%, 0.1)',
    authType: 'oauth2',
    requiredSecrets: ['TIKTOK_APP_ID', 'TIKTOK_APP_SECRET'],
    webhookSupported: false,
    autoEngageSupported: false,
    adCreativeSupported: true,
    apiDocUrl: 'https://developers.tiktok.com/doc',
    characterLimit: 2200,
    mediaFormats: ['video/mp4'],
  },
  reddit: {
    platform: 'reddit',
    name: 'Reddit',
    description: 'Reddit Ads API for community-targeted job promotion',
    icon: MessageSquare,
    color: 'hsl(16, 100%, 50%)',
    bgColor: 'hsl(16, 100%, 50%, 0.1)',
    authType: 'oauth2',
    requiredSecrets: ['REDDIT_CLIENT_ID', 'REDDIT_CLIENT_SECRET'],
    webhookSupported: false,
    autoEngageSupported: false,
    adCreativeSupported: true,
    apiDocUrl: 'https://www.reddit.com/dev/api',
    characterLimit: 40000,
    mediaFormats: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'],
  },
};

/**
 * Get all platform configurations as an array
 */
export function getAllSocialBeacons(): SocialBeaconConfig[] {
  return Object.values(SOCIAL_BEACONS);
}

/**
 * Get platforms that support a specific feature
 */
export function getPlatformsByFeature(
  feature: 'webhookSupported' | 'autoEngageSupported' | 'adCreativeSupported'
): SocialBeaconConfig[] {
  return getAllSocialBeacons().filter(config => config[feature]);
}

/**
 * Get platform configuration by platform key
 */
export function getSocialBeaconConfig(platform: SocialBeaconPlatform): SocialBeaconConfig {
  return SOCIAL_BEACONS[platform];
}

/**
 * Check if a platform key is valid
 */
export function isValidSocialBeaconPlatform(platform: string): platform is SocialBeaconPlatform {
  return platform in SOCIAL_BEACONS;
}

/**
 * Get all required secrets across all platforms
 */
export function getAllRequiredSecrets(): string[] {
  const secrets = new Set<string>();
  getAllSocialBeacons().forEach(config => {
    config.requiredSecrets.forEach(secret => secrets.add(secret));
  });
  return Array.from(secrets);
}

/**
 * Job types for ad creative generation
 */
export const JOB_TYPES = [
  { id: 'long_haul', label: 'Long Haul', description: 'Over-the-road trucking' },
  { id: 'regional', label: 'Regional', description: 'Multi-state regional routes' },
  { id: 'local', label: 'Local', description: 'Daily home time routes' },
  { id: 'dedicated', label: 'Dedicated', description: 'Single customer routes' },
  { id: 'team', label: 'Team Driving', description: 'Two-driver operations' },
] as const;

export type JobType = typeof JOB_TYPES[number]['id'];

/**
 * Benefit options for ad creative generation
 */
export const BENEFIT_OPTIONS = [
  { id: 'sign_on_bonus', label: '$5k Sign-on Bonus', icon: 'DollarSign' },
  { id: 'home_weekly', label: 'Home Weekly', icon: 'Home' },
  { id: 'new_equipment', label: 'New Equipment', icon: 'Truck' },
  { id: 'full_benefits', label: 'Full Benefits', icon: 'Heart' },
  { id: 'pet_friendly', label: 'Pet Friendly', icon: 'PawPrint' },
  { id: 'no_touch_freight', label: 'No Touch Freight', icon: 'Package' },
  { id: 'paid_orientation', label: 'Paid Orientation', icon: 'GraduationCap' },
  { id: 'safety_bonuses', label: 'Safety Bonuses', icon: 'Shield' },
  { id: 'rider_policy', label: 'Rider Policy', icon: 'Users' },
  { id: 'direct_deposit', label: 'Direct Deposit', icon: 'Wallet' },
  { id: 'referral_bonus', label: 'Referral Bonus', icon: 'Gift' },
  { id: 'health_insurance', label: 'Health Insurance', icon: 'HeartPulse' },
] as const;

export type BenefitId = typeof BENEFIT_OPTIONS[number]['id'];

/**
 * Aspect ratio options for ad creatives
 */
export const ASPECT_RATIOS = [
  { id: '16:9', label: '16:9 (Landscape)', description: 'Best for X, Facebook' },
  { id: '1:1', label: '1:1 (Square)', description: 'Best for Instagram Feed' },
  { id: '9:16', label: '9:16 (Portrait)', description: 'Best for Stories, TikTok' },
  { id: '4:5', label: '4:5 (Portrait)', description: 'Best for Instagram Posts' },
] as const;

export type AspectRatio = typeof ASPECT_RATIOS[number]['id'];

/**
 * Media types for ad creatives
 */
export const MEDIA_TYPES = [
  { id: 'ai_image', label: 'AI Generated Image', icon: 'Sparkles' },
  { id: 'ai_video', label: 'AI Generated Video', icon: 'Video' },
  { id: 'upload', label: 'Upload Media', icon: 'Upload' },
] as const;

export type MediaType = typeof MEDIA_TYPES[number]['id'];
