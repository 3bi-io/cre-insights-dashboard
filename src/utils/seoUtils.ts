/**
 * SEO Utility Functions
 * Helpers for generating SEO-optimized content
 */

export interface PageSEO {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  noindex?: boolean;
}

/**
 * Target keywords by page for content optimization
 */
export const PAGE_KEYWORDS = {
  home: 'applicant tracking system, ATS software, AI recruitment, pilot program, early adopter',
  features: 'ATS features, recruitment software features, AI screening, automated workflows, candidate tracking',
  pricing: 'ATS pricing, recruitment software cost, ATS plans, affordable ATS',
  demo: 'ATS demo, recruitment software demo, free trial ATS, test drive ATS',
  resources: 'recruitment resources, hiring guides, ATS tutorials, HR best practices',
  contact: 'contact ATS.me, recruitment software support, sales inquiry',
} as const;

/**
 * Generate optimized page title (max 60 characters)
 */
export function generatePageTitle(baseTitle: string, includeBrand = true): string {
  if (includeBrand && !baseTitle.includes('ATS.me')) {
    const fullTitle = `${baseTitle} - ATS.me`;
    return fullTitle.length <= 60 ? fullTitle : baseTitle;
  }
  return baseTitle.substring(0, 60);
}

/**
 * Generate optimized meta description (max 160 characters)
 */
export function generateMetaDescription(description: string): string {
  return description.length <= 160 
    ? description 
    : description.substring(0, 157) + '...';
}

/**
 * Generate canonical URL
 */
export function generateCanonicalUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `https://ats.me${cleanPath === '/' ? '' : cleanPath}`;
}

/**
 * Generate Open Graph image URL with fallback
 */
export function generateOgImage(customImage?: string): string {
  return customImage || 'https://storage.googleapis.com/gpt-engineer-file-uploads/LQPr9z5dzLVzw8XP92diy1GjByo1/social-images/social-1762327634633-IMG_1035.jpeg';
}

/**
 * Extract keywords from content (simple implementation)
 */
export function extractKeywords(content: string, limit = 10): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'be', 'been',
  ]);

  const words = content
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));

  const frequency = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([word]) => word);
}

/**
 * Generate slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Calculate reading time (words per minute)
 */
export function calculateReadingTime(content: string, wpm = 200): number {
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wpm);
}

/**
 * Validate image alt text
 */
export function validateAltText(altText: string): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (!altText || altText.trim().length === 0) {
    issues.push('Alt text is empty');
  } else {
    if (altText.length < 10) {
      issues.push('Alt text is too short (minimum 10 characters recommended)');
    }
    if (altText.length > 125) {
      issues.push('Alt text is too long (maximum 125 characters recommended)');
    }
    if (/^(image|picture|photo|graphic)\s/i.test(altText)) {
      issues.push('Avoid starting with "image", "picture", "photo", or "graphic"');
    }
    if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(altText)) {
      issues.push('Remove file extension from alt text');
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Check if URL should be indexed
 */
export function shouldIndexUrl(path: string): boolean {
  const noIndexPatterns = [
    '/dashboard',
    '/admin',
    '/settings',
    '/api',
    '/auth/callback',
    '/applications',
    '/jobs',
    '/platforms',
    '/ai-tools',
    '/organizations',
  ];

  return !noIndexPatterns.some(pattern => path.startsWith(pattern));
}
