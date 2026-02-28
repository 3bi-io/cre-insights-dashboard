/**
 * Blog Image Utilities
 * Maps blog post slugs to placeholder images for consistent visuals
 * Provides both local imports for rendering and absolute URLs for OG sharing
 */

import voiceApplyHero from '@/assets/blog/voice-apply-hero.jpg';
import roiRecruitmentHero from '@/assets/blog/roi-recruitment-hero.jpg';
import socialBeaconHero from '@/assets/blog/social-beacon-hero.jpg';
import tenstreetHero from '@/assets/blog/tenstreet-hero.jpg';
import complianceHero from '@/assets/blog/compliance-hero.jpg';
import atsMeThriveHero from '@/assets/blog/ats-me-thrive-hero.jpg';
import seoGuideHero from '@/assets/blog/seo-guide-hero.jpg';
import devopsRoadmapHero from '@/assets/blog/devops-roadmap-hero.jpg';

const BASE_URL = 'https://applyai.jobs';

/** Map of blog slugs to their generated placeholder images (for rendering) */
const BLOG_IMAGE_MAP: Record<string, string> = {
  'what-is-voice-apply-technology': voiceApplyHero,
  'roi-ai-powered-recruitment-2026': roiRecruitmentHero,
  'social-beacon-beyond-job-boards': socialBeaconHero,
  'tenstreet-integration-driver-recruitment': tenstreetHero,
  'recruitment-compliance-ai-hiring-2026': complianceHero,
  'why-ats-me-will-thrive-2026': atsMeThriveHero,
  'advanced-seo-implementation-guide-2026': seoGuideHero,
  'devops-best-practices-comprehensive-guide-2026': devopsRoadmapHero,
};

/** 
 * Map of blog slugs to their public OG images (absolute URLs for social sharing)
 * These should be placed in the public/ directory for consistent access
 */
const BLOG_OG_IMAGE_MAP: Record<string, string> = {
  'what-is-voice-apply-technology': `${BASE_URL}/og-blog-voice-apply.png`,
  'roi-ai-powered-recruitment-2026': `${BASE_URL}/og-blog-roi.png`,
  'social-beacon-beyond-job-boards': `${BASE_URL}/og-blog-social-beacon.png`,
  'tenstreet-integration-driver-recruitment': `${BASE_URL}/og-blog-tenstreet.png`,
  'recruitment-compliance-ai-hiring-2026': `${BASE_URL}/og-blog-compliance.png`,
  'why-ats-me-will-thrive-2026': `${BASE_URL}/og-blog-ats-me-thrive.png`,
  'advanced-seo-implementation-guide-2026': `${BASE_URL}/og-blog-seo-guide.png`,
  'devops-best-practices-comprehensive-guide-2026': `${BASE_URL}/og-blog-devops.png`,
};

/** Default fallback image for posts without a mapped placeholder */
const DEFAULT_BLOG_IMAGE = voiceApplyHero;
const DEFAULT_BLOG_OG_IMAGE = `${BASE_URL}/og-blog.png`;

/**
 * Get the placeholder image for a blog post by slug (for rendering in components).
 * Falls back to a default if no slug-specific image exists.
 */
export function getBlogPlaceholderImage(slug: string): string {
  return BLOG_IMAGE_MAP[slug] || DEFAULT_BLOG_IMAGE;
}

/**
 * Get the OG image URL for a blog post (absolute URL for social sharing).
 * Prioritizes: 1) Database featured_image if absolute URL, 2) Slug-mapped OG image, 3) Default blog OG
 * 
 * @param slug - The blog post slug
 * @param featuredImage - Optional featured image from database
 * @returns Absolute URL suitable for OG meta tags
 */
export function getBlogOgImage(slug: string, featuredImage?: string | null): string {
  // If featured_image is an absolute URL, use it directly
  if (featuredImage && (featuredImage.startsWith('http://') || featuredImage.startsWith('https://'))) {
    return featuredImage;
  }
  
  // Check for slug-specific OG image
  if (BLOG_OG_IMAGE_MAP[slug]) {
    return BLOG_OG_IMAGE_MAP[slug];
  }
  
  // Fallback to default blog OG image
  return DEFAULT_BLOG_OG_IMAGE;
}

/**
 * Check if a blog post has a custom OG image mapped
 */
export function hasBlogOgImage(slug: string): boolean {
  return slug in BLOG_OG_IMAGE_MAP;
}
