/**
 * Platforms Hooks Barrel Export
 * Consolidated platform integration hooks for Meta, Indeed, and general analytics
 */

// Core platform hooks
export { usePlatforms } from '@/hooks/usePlatforms';
export { usePlatformData } from './usePlatformData';

// Meta platform hooks
export { 
  useMetaAccounts, 
  useMetaCampaigns, 
  useMetaAdSets, 
  useMetaAds, 
  useMetaSpend,
  useMetaIntegration 
} from './useMetaData';
export { useMetaAdSetReport } from './useMetaAdSetReport';
export { useMetaSpendAnalytics } from './useMetaSpendAnalytics';

// Indeed platform hooks
export { useIndeedData } from './useIndeedData';

// Analytics and performance hooks
export { usePlatformPerformanceData } from './usePlatformPerformanceData';
export { usePlatformDistributionData } from './usePlatformDistributionData';
export { useSpendTrendData } from './useSpendTrendData';
export { useCostPerLead } from './useCostPerLead';