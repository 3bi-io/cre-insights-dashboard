/**
 * Target Keywords by Page
 * SEO keyword strategy for content optimization
 */

export interface PageKeywords {
  primary: string[];
  secondary: string[];
  longTail: string[];
}

export const TARGET_KEYWORDS: Record<string, PageKeywords> = {
  home: {
    primary: [
      'AI recruitment platform',
      'Apply AI',
      'AI hiring software',
      'voice recruitment platform',
    ],
    secondary: [
      'recruitment software',
      'hiring platform',
      'candidate tracking',
      'HR technology',
      'talent acquisition software',
    ],
    longTail: [
      'best AI-powered recruitment platform 2026',
      'AI recruitment with voice apply',
      'recruitment platform with voice apply',
      'recruitment platform with Tenstreet integration',
      'affordable AI hiring software',
    ],
  },
  features: {
    primary: [
      'Apply AI features',
      'recruitment software features',
      'hiring platform capabilities',
    ],
    secondary: [
      'AI screening',
      'automated workflows',
      'candidate tracking features',
      'job board integration',
      'recruitment analytics',
    ],
    longTail: [
      'recruitment platform with voice apply technology',
      'AI-powered candidate screening',
      'automated interview scheduling',
      'multi-channel job posting',
      'predictive hiring analytics',
    ],
  },
  demo: {
    primary: [
      'Apply AI demo',
      'recruitment software demo',
      'free recruitment trial',
    ],
    secondary: [
      'test drive recruitment software',
      'try AI hiring software',
      'recruitment platform demo',
      'product tour',
    ],
    longTail: [
      'request Apply AI demo',
      'schedule recruitment software demo',
      'see AI hiring in action',
      'personalized recruitment demo',
      'free trial AI recruitment platform',
    ],
  },
  resources: {
    primary: [
      'recruitment resources',
      'hiring guides',
      'recruitment tutorials',
    ],
    secondary: [
      'HR best practices',
      'recruitment tips',
      'hiring strategies',
      'talent acquisition resources',
    ],
    longTail: [
      'how to implement AI recruitment',
      'recruitment best practices 2026',
      'reduce time to hire',
      'improve candidate experience',
      'hiring metrics to track',
    ],
  },
  contact: {
    primary: [
      'contact Apply AI',
      'recruitment software support',
    ],
    secondary: [
      'Apply AI sales inquiry',
      'customer support',
      'get help with recruitment software',
    ],
    longTail: [
      'talk to Apply AI sales team',
      'schedule consultation recruitment software',
      'get in touch Apply AI support',
    ],
  },
};

/**
 * Get keywords for a specific page
 */
export function getPageKeywords(page: string): PageKeywords {
  return TARGET_KEYWORDS[page] || TARGET_KEYWORDS.home;
}

/**
 * Get all primary keywords
 */
export function getAllPrimaryKeywords(): string[] {
  return Object.values(TARGET_KEYWORDS)
    .flatMap(page => page.primary)
    .filter((keyword, index, self) => self.indexOf(keyword) === index);
}

/**
 * Get keyword density target (for content optimization)
 */
export function getKeywordDensity(content: string, keyword: string): number {
  const words = content.toLowerCase().split(/\s+/);
  const keywordWords = keyword.toLowerCase().split(/\s+/);
  let matches = 0;

  for (let i = 0; i <= words.length - keywordWords.length; i++) {
    const phrase = words.slice(i, i + keywordWords.length).join(' ');
    if (phrase === keywordWords.join(' ')) {
      matches++;
    }
  }

  return (matches / words.length) * 100;
}
