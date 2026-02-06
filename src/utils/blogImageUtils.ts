/**
 * Blog Image Utilities
 * Maps blog post slugs to placeholder images for consistent visuals
 */

import voiceApplyHero from '@/assets/blog/voice-apply-hero.jpg';
import roiRecruitmentHero from '@/assets/blog/roi-recruitment-hero.jpg';
import socialBeaconHero from '@/assets/blog/social-beacon-hero.jpg';
import tenstreetHero from '@/assets/blog/tenstreet-hero.jpg';
import complianceHero from '@/assets/blog/compliance-hero.jpg';

/** Map of blog slugs to their generated placeholder images */
const BLOG_IMAGE_MAP: Record<string, string> = {
  'what-is-voice-apply-technology': voiceApplyHero,
  'roi-ai-powered-recruitment-2026': roiRecruitmentHero,
  'social-beacon-beyond-job-boards': socialBeaconHero,
  'tenstreet-integration-driver-recruitment': tenstreetHero,
  'recruitment-compliance-ai-hiring-2026': complianceHero,
};

/** Default fallback image for posts without a mapped placeholder */
const DEFAULT_BLOG_IMAGE = voiceApplyHero;

/**
 * Get the placeholder image for a blog post by slug.
 * Falls back to a default if no slug-specific image exists.
 */
export function getBlogPlaceholderImage(slug: string): string {
  return BLOG_IMAGE_MAP[slug] || DEFAULT_BLOG_IMAGE;
}
