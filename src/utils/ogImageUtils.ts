/**
 * Open Graph Image Utilities
 * Route-aware OG image determination for social sharing
 */

const BASE_URL = 'https://apply.jobs';

/**
 * Static OG images for main pages
 * These should be pre-generated screenshots of each page
 */
const STATIC_OG_IMAGES: Record<string, string> = {
  '/features': `${BASE_URL}/og-features.png`,
  '/jobs': `${BASE_URL}/og-jobs.png`,
  '/clients': `${BASE_URL}/og-clients.png`,
  '/contact': `${BASE_URL}/og-contact.png`,
  '/resources': `${BASE_URL}/og-resources.png`,
  '/demo': `${BASE_URL}/og-demo.png`,
  '/map': `${BASE_URL}/og-map.png`,
  '/privacy-policy': `${BASE_URL}/og-privacy.png`,
  '/terms-of-service': `${BASE_URL}/og-terms.png`,
  '/sitemap': `${BASE_URL}/og-sitemap.png`,
  '/audio/showcase': `${BASE_URL}/og-audio.jpg`,
};

/**
 * Default branded OG image for homepage and fallback
 */
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;

/**
 * Get the appropriate OG image URL based on the current pathname
 * 
 * @param pathname - The current route pathname
 * @returns The OG image URL to use for social sharing
 */
export function getOgImageUrl(pathname: string): string {
  // Homepage keeps the branded image
  if (pathname === '/' || pathname === '') {
    return DEFAULT_OG_IMAGE;
  }

  // Check for static page-specific images
  if (STATIC_OG_IMAGES[pathname]) {
    return STATIC_OG_IMAGES[pathname];
  }

  // For job detail pages, use the jobs listing OG image as fallback
  // (In future, could integrate with screenshot API for dynamic generation)
  if (pathname.startsWith('/jobs/')) {
    return `${BASE_URL}/og-jobs.png`;
  }

  // For client detail pages
  if (pathname.startsWith('/clients/')) {
    return `${BASE_URL}/og-clients.png`;
  }

  // For blog posts - use default blog OG (specific post images handled by BlogPostPage)
  if (pathname.startsWith('/blog/')) {
    return `${BASE_URL}/og-blog.png`;
  }

  // Blog listing page
  if (pathname === '/blog') {
    return `${BASE_URL}/og-blog.png`;
  }

  // For audio showcase pages
  if (pathname.startsWith('/audio/')) {
    return `${BASE_URL}/og-audio.jpg`;
  }

  // Default fallback
  return DEFAULT_OG_IMAGE;
}

/**
 * Check if a page should have a page-specific OG image
 */
export function hasCustomOgImage(pathname: string): boolean {
  if (pathname === '/' || pathname === '') {
    return false; // Homepage uses default branded image
  }
  return pathname in STATIC_OG_IMAGES || 
         pathname.startsWith('/jobs/') || 
         pathname.startsWith('/clients/');
}

/**
 * Get all static OG image paths that should be generated
 */
export function getStaticOgImagePaths(): string[] {
  return Object.values(STATIC_OG_IMAGES);
}
