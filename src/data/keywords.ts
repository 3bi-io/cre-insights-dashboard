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
      'applicant tracking system',
      'ATS software',
      'AI recruitment platform',
      'AI hiring software',
    ],
    secondary: [
      'recruitment software',
      'hiring platform',
      'candidate tracking',
      'HR technology',
      'talent acquisition software',
    ],
    longTail: [
      'best AI-powered ATS 2025',
      'applicant tracking system with AI analytics',
      'ATS software with voice apply',
      'recruitment platform with Tenstreet integration',
      'affordable ATS for small business',
    ],
  },
  features: {
    primary: [
      'ATS features',
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
      'ATS with voice apply technology',
      'AI-powered candidate screening',
      'automated interview scheduling',
      'multi-channel job posting',
      'predictive hiring analytics',
    ],
  },
  pricing: {
    primary: [
      'ATS pricing',
      'recruitment software cost',
      'ATS plans',
    ],
    secondary: [
      'affordable ATS',
      'ATS software pricing',
      'recruitment platform cost',
      'hiring software plans',
    ],
    longTail: [
      'how much does ATS software cost',
      'best affordable applicant tracking system',
      'ATS pricing comparison',
      'free ATS trial',
      'early adopter pricing recruitment software',
    ],
  },
  demo: {
    primary: [
      'ATS demo',
      'recruitment software demo',
      'free ATS trial',
    ],
    secondary: [
      'test drive ATS',
      'try ATS software',
      'recruitment platform demo',
      'ATS product tour',
    ],
    longTail: [
      'request ATS demo',
      'schedule recruitment software demo',
      'see ATS in action',
      'personalized ATS demo',
      'free trial applicant tracking system',
    ],
  },
  resources: {
    primary: [
      'recruitment resources',
      'hiring guides',
      'ATS tutorials',
    ],
    secondary: [
      'HR best practices',
      'recruitment tips',
      'hiring strategies',
      'talent acquisition resources',
    ],
    longTail: [
      'how to implement ATS',
      'recruitment best practices 2025',
      'reduce time to hire',
      'improve candidate experience',
      'hiring metrics to track',
    ],
  },
  contact: {
    primary: [
      'contact ATS.me',
      'recruitment software support',
    ],
    secondary: [
      'ATS sales inquiry',
      'customer support',
      'get help with ATS',
    ],
    longTail: [
      'talk to ATS sales team',
      'schedule consultation recruitment software',
      'get in touch ATS support',
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
