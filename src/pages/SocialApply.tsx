import React from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';

/**
 * Platform-Agnostic Social Apply Route
 * Route: /s/:platform/apply/:jobId
 * 
 * Automatically detects the source platform and applies appropriate UTM parameters.
 * Supports extensible platform mappings without requiring new route components.
 * 
 * Examples:
 * - /s/x/apply/abc123 → utm_source=x, utm_medium=hiring
 * - /s/linkedin/apply/abc123 → utm_source=linkedin, utm_medium=hiring
 * - /s/facebook/apply/abc123 → utm_source=facebook, utm_medium=social
 * - /s/indeed/apply/abc123 → utm_source=indeed, utm_medium=job_board
 */

interface PlatformConfig {
  utmSource: string;
  utmMedium: string;
}

// Extensible platform configuration - add new platforms here
const PLATFORM_CONFIG: Record<string, PlatformConfig> = {
  // Social/Professional Networks
  x: { utmSource: 'x', utmMedium: 'hiring' },
  twitter: { utmSource: 'x', utmMedium: 'hiring' }, // Alias for X
  linkedin: { utmSource: 'linkedin', utmMedium: 'hiring' },
  in: { utmSource: 'linkedin', utmMedium: 'hiring' }, // Short alias
  facebook: { utmSource: 'facebook', utmMedium: 'social' },
  fb: { utmSource: 'facebook', utmMedium: 'social' }, // Short alias
  instagram: { utmSource: 'instagram', utmMedium: 'social' },
  ig: { utmSource: 'instagram', utmMedium: 'social' }, // Short alias
  tiktok: { utmSource: 'tiktok', utmMedium: 'social' },
  
  // Job Boards
  indeed: { utmSource: 'indeed', utmMedium: 'job_board' },
  glassdoor: { utmSource: 'glassdoor', utmMedium: 'job_board' },
  ziprecruiter: { utmSource: 'ziprecruiter', utmMedium: 'job_board' },
  monster: { utmSource: 'monster', utmMedium: 'job_board' },
  
  // Industry-Specific
  cdllife: { utmSource: 'cdllife', utmMedium: 'job_board' },
  truckerpath: { utmSource: 'truckerpath', utmMedium: 'job_board' },
  
  // Other Sources
  email: { utmSource: 'email', utmMedium: 'newsletter' },
  sms: { utmSource: 'sms', utmMedium: 'direct' },
  qr: { utmSource: 'qr', utmMedium: 'offline' },
  referral: { utmSource: 'referral', utmMedium: 'word_of_mouth' },
};

// Default fallback for unknown platforms
const DEFAULT_CONFIG: PlatformConfig = {
  utmSource: 'social',
  utmMedium: 'referral',
};

const SocialApply: React.FC = () => {
  const { platform, jobId } = useParams<{ platform: string; jobId: string }>();
  const [searchParams] = useSearchParams();

  // Normalize platform slug (lowercase, trim)
  const normalizedPlatform = platform?.toLowerCase().trim() || '';
  
  // Get platform config or use defaults
  const config = PLATFORM_CONFIG[normalizedPlatform] || {
    ...DEFAULT_CONFIG,
    utmSource: normalizedPlatform || DEFAULT_CONFIG.utmSource,
  };

  // Build redirect URL with platform-specific UTM params
  const params = new URLSearchParams();
  
  if (jobId) {
    params.set('job_id', jobId);
  }
  
  params.set('utm_source', config.utmSource);
  params.set('utm_medium', config.utmMedium);
  
  // Preserve any additional UTM params from the URL
  const utmCampaign = searchParams.get('utm_campaign') || searchParams.get('campaign');
  if (utmCampaign) params.set('utm_campaign', utmCampaign);
  
  const utmContent = searchParams.get('utm_content');
  if (utmContent) params.set('utm_content', utmContent);
  
  const utmTerm = searchParams.get('utm_term');
  if (utmTerm) params.set('utm_term', utmTerm);

  // Immediate declarative redirect - no intermediate state/render
  return <Navigate to={`/apply?${params.toString()}`} replace />;
};

export default SocialApply;

// Export platform config for use in URL builders
export { PLATFORM_CONFIG, DEFAULT_CONFIG };
export type { PlatformConfig };
