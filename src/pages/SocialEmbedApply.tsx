import React from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { PLATFORM_CONFIG, DEFAULT_CONFIG } from './SocialApply';

/**
 * Platform-Agnostic Social Embed Apply Route
 * Route: /s/:platform/embed/apply?job_id=...
 * 
 * Redirects to /embed/apply with appropriate UTM parameters based on platform.
 * Preserves all existing query parameters (especially job_id).
 * 
 * Examples:
 * - /s/indeed/embed/apply?job_id=abc → /embed/apply?job_id=abc&utm_source=indeed&utm_medium=job_board
 * - /s/linkedin/embed/apply?job_id=abc → /embed/apply?job_id=abc&utm_source=linkedin&utm_medium=hiring
 * - /s/facebook/embed/apply?job_id=abc → /embed/apply?job_id=abc&utm_source=facebook&utm_medium=social
 */
const SocialEmbedApply: React.FC = () => {
  const { platform } = useParams<{ platform: string }>();
  const [searchParams] = useSearchParams();

  // Normalize platform slug (lowercase, trim)
  const normalizedPlatform = platform?.toLowerCase().trim() || '';
  
  // Get platform config or use defaults
  const config = PLATFORM_CONFIG[normalizedPlatform] || {
    ...DEFAULT_CONFIG,
    utmSource: normalizedPlatform || DEFAULT_CONFIG.utmSource,
  };

  // Build redirect URL preserving all existing params and adding UTM
  const params = new URLSearchParams(searchParams);
  
  // Set UTM parameters (will override if already present)
  params.set('utm_source', config.utmSource);
  params.set('utm_medium', config.utmMedium);

  // Immediate declarative redirect - no intermediate state/render
  return <Navigate to={`/embed/apply?${params.toString()}`} replace />;
};

export default SocialEmbedApply;
