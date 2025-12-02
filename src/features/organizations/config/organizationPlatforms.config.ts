import { PlatformConfig, PlatformKey, PlatformCategory } from '../types/platforms.types';
import { Truck, Globe, FileText, DollarSign, Building2, Zap, TrendingUp } from 'lucide-react';

/**
 * Centralized platform configuration
 * This is the single source of truth for all organization platforms
 */
export const ORGANIZATION_PLATFORMS: Record<PlatformKey, PlatformConfig> = {
  'google-jobs': {
    key: 'google-jobs',
    name: 'Google Jobs',
    description: 'Google for Jobs integration with XML feeds',
    category: 'General Platforms',
    icon: 'FileText',
  },
  indeed: {
    key: 'indeed',
    name: 'Indeed',
    description: 'Indeed job board integration',
    category: 'General Platforms',
    icon: 'Globe',
  },
  simplyhired: {
    key: 'simplyhired',
    name: 'SimplyHired',
    description: 'Free job aggregator network',
    category: 'General Platforms',
    icon: 'Globe',
  },
  meta: {
    key: 'meta',
    name: 'Meta',
    description: 'Facebook and Instagram job ads',
    category: 'Social Media Platforms',
    icon: 'Globe',
    premium: true,
  },
  craigslist: {
    key: 'craigslist',
    name: 'Craigslist',
    description: 'Free local job postings via RSS feed',
    category: 'Classifieds Platforms',
    icon: 'DollarSign',
  },
  glassdoor: {
    key: 'glassdoor',
    name: 'Glassdoor',
    description: 'Company reviews and job platform',
    category: 'Reviews Platforms',
    icon: 'Building2',
  },
  'truck-driver-jobs-411': {
    key: 'truck-driver-jobs-411',
    name: 'Truck Driver Jobs 411',
    description: 'Free CDL-focused job board',
    category: 'Trucking Platforms',
    icon: 'Truck',
  },
  newjobs4you: {
    key: 'newjobs4you',
    name: 'NewJobs4You',
    description: 'Free transportation jobs board',
    category: 'Transportation Platforms',
    icon: 'Truck',
  },
  roadwarriors: {
    key: 'roadwarriors',
    name: 'RoadWarriors',
    description: 'Free trucking community and jobs',
    category: 'Trucking Platforms',
    icon: 'Truck',
  },
  ats_explorer: {
    key: 'ats_explorer',
    name: 'ATS Explorer',
    description: 'Advanced ATS API exploration and testing tool for Tenstreet integration',
    category: 'Admin Tools',
    icon: 'Zap',
    adminOnly: true,
  },
  import_applications: {
    key: 'import_applications',
    name: 'Import Applications',
    description: 'Bulk import applications via CSV upload for administrators',
    category: 'Admin Tools',
    icon: 'FileText',
    adminOnly: true,
  },
  adzuna: {
    key: 'adzuna',
    name: 'Adzuna',
    description: 'Performance-based job advertising platform',
    category: 'General Platforms',
    icon: 'TrendingUp',
  },
  talroo: {
    key: 'talroo',
    name: 'Talroo',
    description: 'Programmatic job advertising with CPA/CPC pricing',
    category: 'General Platforms',
    icon: 'TrendingUp',
  },
};

/**
 * Get all available platforms as an array
 */
export const getAllPlatforms = (): PlatformConfig[] => {
  return Object.values(ORGANIZATION_PLATFORMS);
};

/**
 * Get platforms grouped by category
 */
export const getPlatformsByCategory = () => {
  const platforms = getAllPlatforms();
  return platforms.reduce((acc, platform) => {
    if (!acc[platform.category]) {
      acc[platform.category] = [];
    }
    acc[platform.category].push(platform);
    return acc;
  }, {} as Record<PlatformCategory, PlatformConfig[]>);
};

/**
 * Get platform configuration by key
 */
export const getPlatformConfig = (key: PlatformKey): PlatformConfig | undefined => {
  return ORGANIZATION_PLATFORMS[key];
};

/**
 * Validate if a string is a valid platform key
 */
export const isValidPlatformKey = (key: string): key is PlatformKey => {
  return key in ORGANIZATION_PLATFORMS;
};

/**
 * Get icon component for platform
 */
export const getPlatformIcon = (platformKey: PlatformKey) => {
  const iconName = ORGANIZATION_PLATFORMS[platformKey]?.icon;
  
  switch (iconName) {
    case 'Truck':
      return Truck;
    case 'Globe':
      return Globe;
    case 'FileText':
      return FileText;
    case 'DollarSign':
      return DollarSign;
    case 'Building2':
      return Building2;
    case 'Zap':
      return Zap;
    case 'TrendingUp':
      return TrendingUp;
    default:
      return Globe;
  }
};

/**
 * Get category badge styling
 */
export const getCategoryColor = (category: PlatformCategory) => {
  switch (category) {
    case 'General Platforms':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Social Media Platforms':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'Classifieds Platforms':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Reviews Platforms':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'Trucking Platforms':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'Transportation Platforms':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Admin Tools':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};
