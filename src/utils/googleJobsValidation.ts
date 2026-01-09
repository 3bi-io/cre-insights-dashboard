/**
 * Google Jobs Validation Utilities
 * Shared validation logic for sitemap feeds and JobPosting schema
 */

import { 
  FeedValidationResult, 
  ValidatedUrl, 
  GoogleJobsSitemapEntry,
  SITEMAP_NAMESPACE 
} from '@/types/googleJobs';

/**
 * Validates a sitemap XML feed for Google Jobs compatibility
 */
export function validateSitemapFeed(xmlText: string): FeedValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let urlCount = 0;

  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    // Check for parse errors
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      errors.push('XML syntax error: ' + (parseError.textContent?.substring(0, 200) || 'Unknown error'));
      return { 
        isValid: false, 
        urlCount: 0, 
        errors, 
        warnings, 
        sitemapPreview: xmlText.substring(0, 500),
        urlsWithJsonLd: 0,
        urlsWithoutJsonLd: 0
      };
    }

    // Check for urlset root element (sitemap format)
    const urlset = xmlDoc.querySelector('urlset');
    if (!urlset) {
      errors.push('Missing <urlset> root element - this should be a sitemap XML, not RSS');
      return { 
        isValid: false, 
        urlCount: 0, 
        errors, 
        warnings, 
        sitemapPreview: xmlText.substring(0, 500),
        urlsWithJsonLd: 0,
        urlsWithoutJsonLd: 0
      };
    }

    // Check namespace
    const xmlns = urlset.getAttribute('xmlns');
    if (!xmlns || !xmlns.includes('sitemaps.org')) {
      warnings.push('Missing or incorrect xmlns namespace. Expected: http://www.sitemaps.org/schemas/sitemap/0.9');
    }

    // Get all URL entries
    const urls = xmlDoc.querySelectorAll('url');
    urlCount = urls.length;

    if (urlCount === 0) {
      warnings.push('No <url> entries found in the sitemap');
    }

    // Validate each URL entry
    urls.forEach((urlElement, index) => {
      const loc = urlElement.querySelector('loc')?.textContent?.trim();
      const lastmod = urlElement.querySelector('lastmod')?.textContent?.trim();

      if (!loc) {
        errors.push(`URL ${index + 1}: Missing required <loc> element`);
      } else {
        // Validate URL format
        try {
          new URL(loc);
        } catch {
          errors.push(`URL ${index + 1}: Invalid URL format in <loc>: ${loc}`);
        }

        // Check if URL points to a job page
        if (!loc.includes('/jobs/') && !loc.includes('/job/') && !loc.includes('/careers/')) {
          warnings.push(`URL ${index + 1}: URL may not be a job page: ${loc}`);
        }
      }

      // Validate lastmod format (ISO 8601)
      if (lastmod) {
        const date = new Date(lastmod);
        if (isNaN(date.getTime())) {
          errors.push(`URL ${index + 1}: Invalid <lastmod> date format: ${lastmod}`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      urlCount,
      errors,
      warnings,
      sitemapPreview: xmlText.substring(0, 1000),
      urlsWithJsonLd: 0, // Will be populated by deep validation
      urlsWithoutJsonLd: 0
    };

  } catch (error) {
    return {
      isValid: false,
      urlCount: 0,
      errors: ['Failed to parse XML: ' + (error as Error).message],
      warnings,
      sitemapPreview: xmlText.substring(0, 500),
      urlsWithJsonLd: 0,
      urlsWithoutJsonLd: 0
    };
  }
}

/**
 * Extracts URLs from a sitemap XML
 */
export function extractSitemapUrls(xmlText: string): GoogleJobsSitemapEntry[] {
  const entries: GoogleJobsSitemapEntry[] = [];
  
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    const urls = xmlDoc.querySelectorAll('url');
    urls.forEach((urlElement) => {
      const loc = urlElement.querySelector('loc')?.textContent?.trim();
      const lastmod = urlElement.querySelector('lastmod')?.textContent?.trim();
      const changefreq = urlElement.querySelector('changefreq')?.textContent?.trim() as GoogleJobsSitemapEntry['changefreq'];
      const priority = urlElement.querySelector('priority')?.textContent?.trim();

      if (loc) {
        entries.push({
          loc,
          lastmod: lastmod || new Date().toISOString(),
          changefreq,
          priority: priority ? parseFloat(priority) : undefined
        });
      }
    });
  } catch (error) {
    console.error('Failed to extract sitemap URLs:', error);
  }

  return entries;
}

/**
 * Validates JobPosting JSON-LD schema
 */
export function validateJobPostingSchema(jsonLd: Record<string, unknown>): { 
  isValid: boolean; 
  errors: string[]; 
  warnings: string[] 
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check @type
  if (jsonLd['@type'] !== 'JobPosting') {
    errors.push('Schema @type must be "JobPosting"');
    return { isValid: false, errors, warnings };
  }

  // Required fields
  const requiredFields = ['title', 'description', 'datePosted', 'hiringOrganization'];
  requiredFields.forEach(field => {
    if (!jsonLd[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Validate hiringOrganization
  const hiringOrg = jsonLd.hiringOrganization as Record<string, unknown> | undefined;
  if (hiringOrg) {
    if (hiringOrg['@type'] !== 'Organization') {
      errors.push('hiringOrganization @type must be "Organization"');
    }
    if (!hiringOrg.name) {
      errors.push('hiringOrganization must have a name');
    }
  }

  // Validate jobLocation
  const jobLocation = jsonLd.jobLocation as Record<string, unknown> | undefined;
  if (!jobLocation) {
    warnings.push('Missing jobLocation - required unless job is fully remote');
  } else {
    if (jobLocation['@type'] !== 'Place') {
      errors.push('jobLocation @type must be "Place"');
    }
    const address = jobLocation.address as Record<string, unknown> | undefined;
    if (!address) {
      warnings.push('jobLocation should have an address');
    } else if (address['@type'] !== 'PostalAddress') {
      errors.push('jobLocation.address @type must be "PostalAddress"');
    }
  }

  // Validate identifier (recommended)
  if (!jsonLd.identifier) {
    warnings.push('Missing identifier - recommended for tracking job listings');
  }

  // Validate baseSalary
  const baseSalary = jsonLd.baseSalary as Record<string, unknown> | undefined;
  if (baseSalary) {
    if (baseSalary['@type'] !== 'MonetaryAmount') {
      errors.push('baseSalary @type must be "MonetaryAmount"');
    }
    const value = baseSalary.value as Record<string, unknown> | undefined;
    if (value && value['@type'] !== 'QuantitativeValue') {
      errors.push('baseSalary.value @type must be "QuantitativeValue"');
    }
  } else {
    warnings.push('Missing baseSalary - recommended for better search visibility');
  }

  // Validate validThrough
  if (!jsonLd.validThrough) {
    warnings.push('Missing validThrough - helps Google know when job expires');
  }

  // Validate employmentType
  const validEmploymentTypes = [
    'FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'TEMPORARY', 
    'INTERN', 'VOLUNTEER', 'PER_DIEM', 'OTHER'
  ];
  const employmentType = jsonLd.employmentType;
  if (employmentType) {
    const types = Array.isArray(employmentType) ? employmentType : [employmentType];
    types.forEach(type => {
      if (!validEmploymentTypes.includes(type as string)) {
        warnings.push(`Unknown employmentType: ${type}. Valid types: ${validEmploymentTypes.join(', ')}`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Extracts JSON-LD from HTML content
 */
export function extractJsonLdFromHtml(html: string): Record<string, unknown>[] {
  const jsonLdScripts: Record<string, unknown>[] = [];
  
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    
    scripts.forEach(script => {
      try {
        const content = script.textContent;
        if (content) {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            jsonLdScripts.push(...parsed);
          } else {
            jsonLdScripts.push(parsed);
          }
        }
      } catch (e) {
        console.error('Failed to parse JSON-LD:', e);
      }
    });
  } catch (error) {
    console.error('Failed to parse HTML:', error);
  }

  return jsonLdScripts;
}

/**
 * Finds JobPosting schema from JSON-LD array
 */
export function findJobPostingSchema(jsonLdArray: Record<string, unknown>[]): Record<string, unknown> | null {
  for (const item of jsonLdArray) {
    if (item['@type'] === 'JobPosting') {
      return item;
    }
    // Check for @graph structure
    const graph = item['@graph'] as Record<string, unknown>[] | undefined;
    if (graph) {
      const jobPosting = graph.find(g => g['@type'] === 'JobPosting');
      if (jobPosting) return jobPosting;
    }
  }
  return null;
}
