/**
 * Internal Linking Strategy
 * Centralized site-wide link structure for SEO
 */

export interface InternalLink {
  path: string;
  label: string;
  description?: string;
  category: 'primary' | 'secondary' | 'legal' | 'resource';
  priority: number;
}

/**
 * Site-wide navigation structure
 */
export const INTERNAL_LINKS: InternalLink[] = [
  // Primary navigation
  {
    path: '/',
    label: 'Home',
    description: 'AI-powered recruitment platform',
    category: 'primary',
    priority: 1.0,
  },
  {
    path: '/jobs',
    label: 'Jobs',
    description: 'Browse available positions',
    category: 'primary',
    priority: 0.9,
  },
  {
    path: '/features',
    label: 'Features',
    description: 'Explore ATS.me features and capabilities',
    category: 'primary',
    priority: 0.9,
  },
  {
    path: '/pricing',
    label: 'Pricing',
    description: 'View pricing plans and early adopter offers',
    category: 'primary',
    priority: 0.9,
  },
  {
    path: '/resources',
    label: 'Resources',
    description: 'Recruitment guides and best practices',
    category: 'primary',
    priority: 0.7,
  },
  {
    path: '/contact',
    label: 'Contact',
    description: 'Get in touch with our team',
    category: 'primary',
    priority: 0.8,
  },

  // Secondary navigation
  {
    path: '/auth',
    label: 'Sign In',
    description: 'Access your ATS.me account',
    category: 'secondary',
    priority: 0.6,
  },

  // Legal
  {
    path: '/privacy-policy',
    label: 'Privacy Policy',
    description: 'How we protect your data',
    category: 'legal',
    priority: 0.3,
  },
  {
    path: '/terms-of-service',
    label: 'Terms of Service',
    description: 'Terms and conditions of use',
    category: 'legal',
    priority: 0.3,
  },
  {
    path: '/cookie-policy',
    label: 'Cookie Policy',
    description: 'How we use cookies',
    category: 'legal',
    priority: 0.3,
  },
  {
    path: '/sitemap',
    label: 'Sitemap',
    description: 'Site navigation directory',
    category: 'secondary',
    priority: 0.5,
  },
];

/**
 * Get links by category
 */
export function getLinksByCategory(category: InternalLink['category']): InternalLink[] {
  return INTERNAL_LINKS.filter(link => link.category === category);
}

/**
 * Get link by path
 */
export function getLinkByPath(path: string): InternalLink | undefined {
  return INTERNAL_LINKS.find(link => link.path === path);
}

/**
 * Generate contextual links for a page
 */
export function getContextualLinks(currentPath: string): InternalLink[] {
  const currentLink = getLinkByPath(currentPath);
  
  // Return related links based on current page
  if (!currentLink) {
    return getLinksByCategory('primary');
  }

  // For primary pages, suggest other primary pages
  if (currentLink.category === 'primary') {
    return INTERNAL_LINKS
      .filter(link => link.category === 'primary' && link.path !== currentPath)
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 3);
  }

  return getLinksByCategory('primary').slice(0, 3);
}

/**
 * Related content suggestions based on keywords
 */
export const RELATED_CONTENT: Record<string, string[]> = {
  'AI recruitment': ['/features', '/contact', '/pricing'],
  'Voice Apply': ['/features', '/contact'],
  'Tenstreet': ['/features', '/resources'],
  'analytics': ['/features', '/contact'],
  'job boards': ['/features', '/pricing'],
  'screening': ['/features', '/contact'],
  'ATS software': ['/', '/features', '/pricing'],
};

/**
 * Get related links by keyword
 */
export function getRelatedLinks(keywords: string[]): InternalLink[] {
  const paths = new Set<string>();
  
  keywords.forEach(keyword => {
    const relatedPaths = RELATED_CONTENT[keyword.toLowerCase()];
    if (relatedPaths) {
      relatedPaths.forEach(path => paths.add(path));
    }
  });

  return Array.from(paths)
    .map(path => getLinkByPath(path))
    .filter((link): link is InternalLink => link !== undefined)
    .sort((a, b) => b.priority - a.priority);
}
