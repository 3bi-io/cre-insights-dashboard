/**
 * XML Parsing Utilities for Job Feeds
 * Provides shared XML parsing and field extraction
 */

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

  return {
    id: extractField('referencenumber') || extractField('id') || undefined,
    title: extractField('title') || extractField('job_title') || undefined,
    description: extractField('description') || extractField('notes') || undefined,
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
