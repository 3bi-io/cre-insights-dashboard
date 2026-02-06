/**
 * XML Parsing Utilities for Job Feeds
 * Provides shared XML parsing and field extraction
 */

export interface IndeedApplyData {
  apiToken?: string;
  jobId?: string;
  postUrl?: string;
  raw?: Record<string, string>;
}

export interface ParsedJob {
  id?: string;
  title?: string;
  description?: string;
  company?: string;
  location?: string;
  city?: string;
  state?: string;
  url?: string;
  phone?: string;
  salary?: string;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_type?: string;
  jobtype?: string;
  category?: string;
  referencenumber?: string;
  experience?: string;
  education?: string;
  country?: string;
  postalcode?: string;
  source?: string;
  date?: string;
  status?: string;
  type?: string;
  last_updated?: string;
  // Sponsorship fields
  jobreferrer?: string;
  is_sponsored?: boolean;
  // NEW: Feed date tracking
  feed_date?: string;
  // NEW: Indeed Apply integration
  indeed_apply_api_token?: string;
  indeed_apply_job_id?: string;
  indeed_apply_post_url?: string;
  indeed_apply_data?: IndeedApplyData;
  // NEW: Tracking pixel
  tracking_pixel_url?: string;
  // NEW: Raw XML for metadata storage
  raw_xml?: string;
}

/**
 * Extract field value from XML string
 * Handles both CDATA and regular XML elements
 */
export function extractXMLField(xml: string, fieldName: string): string | null {
  // Try CDATA format first
  const cdataRegex = new RegExp(`<${fieldName}><!\\[CDATA\\[(.*?)\\]\\]><\\/${fieldName}>`, 'is');
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) {
    return cdataMatch[1].trim();
  }

  // Fallback to regular XML element
  const simpleRegex = new RegExp(`<${fieldName}>(.*?)<\\/${fieldName}>`, 'is');
  const simpleMatch = xml.match(simpleRegex);
  if (simpleMatch) {
    return simpleMatch[1].trim();
  }

  return null;
}

/**
 * Parse salary range from text format
 * Example: "$65000 - $80000 per year" -> { min: 65000, max: 80000, type: 'yearly' }
 */
export function parseSalaryRange(salaryText: string | null): {
  min: number | null;
  max: number | null;
  type: string;
} {
  if (!salaryText) {
    return { min: null, max: null, type: 'yearly' };
  }

  const match = salaryText.match(/\$(\d+)(?:,(\d+))?\s*-\s*\$(\d+)(?:,(\d+))?\s+per\s+(\w+)/i);
  if (match) {
    const minSalary = parseInt(match[1] + (match[2] || ''));
    const maxSalary = parseInt(match[3] + (match[4] || ''));
    const period = match[5].toLowerCase();

    return {
      min: minSalary,
      max: maxSalary,
      type: period === 'year' ? 'yearly' : period === 'hour' ? 'hourly' : 'yearly',
    };
  }

  return { min: null, max: null, type: 'yearly' };
}

/**
 * Parse feed date from various formats to ISO timestamp
 * Handles: ISO 8601, US format (MM/DD/YYYY), European (DD/MM/YYYY), 
 * and common variations like "Jan 15, 2024"
 */
export function parseFeedDate(dateString: string | null): string | null {
  if (!dateString || !dateString.trim()) {
    return null;
  }

  const trimmed = dateString.trim();

  // Try ISO 8601 format first
  const isoDate = new Date(trimmed);
  if (!isNaN(isoDate.getTime()) && trimmed.includes('-')) {
    return isoDate.toISOString();
  }

  // Try US format MM/DD/YYYY
  const usMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usMatch) {
    const [, month, day, year] = usMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  // Try text format "Jan 15, 2024" or "January 15, 2024"
  const textMatch = trimmed.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (textMatch) {
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  // Try YYYY-MM-DD without time
  const simpleMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (simpleMatch) {
    const [, year, month, day] = simpleMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  // Fallback: try native Date parsing
  const fallbackDate = new Date(trimmed);
  if (!isNaN(fallbackDate.getTime())) {
    return fallbackDate.toISOString();
  }

  return null;
}

/**
 * Extract Indeed Apply data from job XML
 * Parses the <indeed-apply-data> block and extracts key fields
 */
export function extractIndeedApplyData(jobXml: string): IndeedApplyData | null {
  // Match the indeed-apply-data block
  const blockMatch = jobXml.match(/<indeed-apply-data>([\s\S]*?)<\/indeed-apply-data>/i);
  if (!blockMatch) {
    return null;
  }

  const block = blockMatch[1];
  const result: IndeedApplyData = { raw: {} };

  // Extract all indeed-apply-* fields
  const fieldRegex = /<(indeed-apply-[^>]+)>([^<]*)<\/\1>/gi;
  let match;

  while ((match = fieldRegex.exec(block)) !== null) {
    const fieldName = match[1].toLowerCase();
    const fieldValue = match[2].trim();

    // Store in raw object
    result.raw![fieldName] = fieldValue;

    // Map specific fields
    if (fieldName === 'indeed-apply-apitoken') {
      result.apiToken = fieldValue;
    } else if (fieldName === 'indeed-apply-jobid') {
      result.jobId = fieldValue;
    } else if (fieldName === 'indeed-apply-posturl') {
      result.postUrl = fieldValue;
    }
  }

  // Return null if no fields were found
  if (Object.keys(result.raw!).length === 0) {
    return null;
  }

  return result;
}

/**
 * Extract tracking pixel URL from job description
 * Finds 1x1 pixel images typically used for impression tracking
 */
export function extractTrackingPixel(description: string | null): string | null {
  if (!description) {
    return null;
  }

  // Match 1x1 pixel images with various attribute orders
  // Pattern 1: width="1" height="1" src="..."
  // Pattern 2: src="..." width="1" height="1"
  // Pattern 3: width=1 height=1 (without quotes)
  const patterns = [
    // Standard 1x1 pixel with width/height before src
    /<img[^>]*\bwidth=["']?1["']?[^>]*\bheight=["']?1["']?[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi,
    // 1x1 pixel with src before width/height
    /<img[^>]*\bsrc=["']([^"']+)["'][^>]*\bwidth=["']?1["']?[^>]*\bheight=["']?1["']?[^>]*>/gi,
    // General 1x1 pattern matching any order
    /<img[^>]*(?=.*\bwidth=["']?1["']?)(?=.*\bheight=["']?1["']?)[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi,
  ];

  for (const pattern of patterns) {
    // Reset regex state
    pattern.lastIndex = 0;
    const match = pattern.exec(description);
    if (match && match[1]) {
      return match[1];
    }
  }

  // Try a more permissive pattern for edge cases
  const fallbackPattern = /<img[^>]*src=["']([^"']+)[^>]*(?:width|height)=["']?1["']?/i;
  const fallbackMatch = description.match(fallbackPattern);
  if (fallbackMatch && fallbackMatch[1]) {
    // Verify it's likely a tracking pixel (small dimensions)
    const fullTag = fallbackMatch[0];
    if (fullTag.includes('width="1"') || fullTag.includes('width=1') ||
        fullTag.includes('height="1"') || fullTag.includes('height=1')) {
      return fallbackMatch[1];
    }
  }

  return null;
}

/**
 * Parse a single job from XML string
 */
export function parseJobFromXML(jobXml: string): ParsedJob {
  const extractField = (field: string) => extractXMLField(jobXml, field);

  const salaryText = extractField('salary');
  const salary = parseSalaryRange(salaryText);
  
  // Extract jobreferrer for sponsorship tracking
  const jobreferrer = extractField('jobreferrer') || undefined;
  
  // Determine sponsorship status based on jobreferrer presence
  // Jobs with a jobreferrer are typically sponsored/paid placements
  const is_sponsored = !!jobreferrer;

  // Extract description for tracking pixel extraction
  const description = extractField('description') || extractField('notes') || undefined;

  // NEW: Extract feed date
  const dateRaw = extractField('date');
  const feed_date = parseFeedDate(dateRaw) || undefined;

  // NEW: Extract Indeed Apply data
  const indeedApplyData = extractIndeedApplyData(jobXml);
  
  // NEW: Extract tracking pixel from description
  const tracking_pixel_url = extractTrackingPixel(description || null) || undefined;

  return {
    id: extractField('referencenumber') || extractField('id') || undefined,
    title: extractField('title') || extractField('job_title') || undefined,
    description,
    company: extractField('company') || undefined,
    location: extractField('location') || undefined,
    city: extractField('city') || undefined,
    state: extractField('state') || undefined,
    url: extractField('url') || extractField('link') || undefined,
    phone: extractField('phone') || undefined,
    salary: salaryText || undefined,
    salary_min: salary.min,
    salary_max: salary.max,
    salary_type: salary.type,
    jobtype: extractField('jobtype') || undefined,
    category: extractField('category') || undefined,
    referencenumber: extractField('referencenumber') || extractField('id') || undefined,
    experience: extractField('experience') || undefined,
    education: extractField('education') || undefined,
    country: extractField('country') || undefined,
    postalcode: extractField('postalcode') || undefined,
    // Sponsorship fields
    jobreferrer,
    is_sponsored,
    // NEW: Feed date tracking
    feed_date,
    // NEW: Indeed Apply integration fields
    indeed_apply_api_token: indeedApplyData?.apiToken,
    indeed_apply_job_id: indeedApplyData?.jobId,
    indeed_apply_post_url: indeedApplyData?.postUrl,
    indeed_apply_data: indeedApplyData || undefined,
    // NEW: Tracking pixel
    tracking_pixel_url,
    // Store raw XML for metadata table
    raw_xml: jobXml,
  };
}

/**
 * Parse XML feed and extract all jobs
 */
export function parseXMLFeed(xmlText: string): ParsedJob[] {
  const jobs: ParsedJob[] = [];
  
  // Extract job elements using regex
  const jobMatches = xmlText.matchAll(/<job>(.*?)<\/job>/gs);

  for (const match of jobMatches) {
    const jobXml = match[1];
    const job = parseJobFromXML(jobXml);
    jobs.push(job);
  }

  return jobs;
}

/**
 * Parse XML feed for job listings (with additional metadata)
 */
export function parseXMLFeedForListings(xmlText: string, source: string = 'XML Feed'): ParsedJob[] {
  const jobs = parseXMLFeed(xmlText);
  const timestamp = new Date().toISOString();

  return jobs.map(job => {
    // Generate location from city/state if not provided
    const location = job.location || 
      (job.city && job.state ? `${job.city}, ${job.state}` : job.city || job.state || '');

    return {
      ...job,
      id: job.id || `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      location,
      source,
      status: 'active',
      type: 'job_listing',
      last_updated: timestamp,
    };
  });
}
