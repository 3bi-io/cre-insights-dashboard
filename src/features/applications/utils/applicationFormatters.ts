import { ApplicationCategory } from '../types';

/**
 * Minimal application interface for formatter functions
 * Uses optional fields to support both typed Application and raw Supabase data
 * Note: We use a permissive interface that works with any application-like object
 */
interface ApplicationLike {
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  applicant_email?: string | null;
  city?: string | null;
  state?: string | null;
  cdl?: string | null;
  age?: string | null;
  exp?: string | null;
  months?: string | null;
  source?: string | null;
  job_listing_id?: string | null;
  job_listings?: {
    title?: string | null;
    job_title?: string | null;
    organization_id?: string | null;
    clients?: { name?: string | null } | null;
    client?: string | null;
  } | null;
}

// Type helper to accept both Application and raw Supabase data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyApplication = ApplicationLike | any;

/**
 * Special UUID marker for applications whose job listings have been deleted
 */
export const ORPHANED_JOB_ID = '00000000-0000-0000-0000-000000000000';

/**
 * Checks if an application's job listing has been deleted
 */
export const isOrphanedApplication = (jobListingId?: string | null): boolean => {
  return !jobListingId || jobListingId === ORPHANED_JOB_ID;
};

/**
 * Gets the full name of an applicant with fallback logic
 */
export const getApplicantName = (app: AnyApplication): string => {
  if (app.first_name && app.last_name) {
    return `${app.first_name} ${app.last_name}`;
  } else if (app.first_name) {
    return app.first_name;
  } else if (app.last_name) {
    return app.last_name;
  } else if (app.full_name) {
    return app.full_name;
  }
  return 'Anonymous Applicant';
};

/**
 * Gets the email of an applicant with fallback
 */
export const getApplicantEmail = (app: AnyApplication): string => {
  return app.applicant_email || 'No email provided';
};

/**
 * Formats the location display for an applicant
 */
export const getApplicantLocation = (app: AnyApplication): string => {
  const city = app.city || '';
  const state = app.state || '';
  
  if (!city && !state) return 'No location provided';
  if (!city) return state;
  if (!state) return city;
  
  // Use state abbreviation if it's longer than 2 characters
  const stateDisplay = state.length > 2 ? state.substring(0, 2).toUpperCase() : state.toUpperCase();
  
  return `${city}, ${stateDisplay}`;
};

/**
 * Gets the client name from job listing relationship
 */
export const getClientName = (app: AnyApplication): string | null => {
  if (isOrphanedApplication(app.job_listing_id)) {
    return null;
  }
  const jobListing = app.job_listings as any;
  return jobListing?.clients?.name || jobListing?.client || null;
};

/**
 * Gets the job title from application
 */
export const getJobTitle = (app: AnyApplication): string => {
  if (isOrphanedApplication(app.job_listing_id)) {
    return 'Job Removed';
  }
  return app.job_listings?.title || app.job_listings?.job_title || 'Unknown Position';
};

/**
 * Gets the display title for a job, showing client name for "General Application" listings
 * This provides a more meaningful title in the UI when the job is a generic fallback
 */
export const getJobDisplayTitle = (app: AnyApplication): string => {
  // Handle missing job listing (orphaned)
  if (isOrphanedApplication(app.job_listing_id)) {
    return 'Job Removed';
  }
  
  const rawTitle = app.job_listings?.title || app.job_listings?.job_title;
  
  // Handle no title
  if (!rawTitle) {
    return 'Unknown Position';
  }
  
  // For "General Application" jobs, display client name if available
  if (rawTitle.toLowerCase().includes('general application')) {
    const clientName = getClientName(app);
    return clientName || rawTitle;
  }
  
  return rawTitle;
};

/**
 * Parses experience from application data
 * Handles multiple formats: numeric months, text descriptions, legacy data
 * Returns number of months or null if unable to determine
 */
export const parseExperienceMonths = (app: AnyApplication): number | null => {
  // Priority 1: Use numeric "months" field if available
  if (app.months) {
    const monthsNum = parseInt(app.months, 10);
    if (!isNaN(monthsNum) && monthsNum >= 0) {
      return monthsNum;
    }
  }
  
  // Priority 2: Parse "exp" text field
  const expValue = app.exp?.toLowerCase()?.trim() || '';
  
  if (!expValue) return null;
  
  // Check for standard text formats from submit-application edge function
  if (expValue.includes('less than 3 months')) {
    return 0;
  }
  
  if (expValue.includes('more than 3 months') || expValue.includes('3+ months')) {
    return 3;
  }
  
  // Handle legacy/imported data formats: "24Months", "36+ Months", "48 months"
  const monthsMatch = expValue.match(/^(\d+)\s*\+?\s*months?$/i);
  if (monthsMatch) {
    return parseInt(monthsMatch[1], 10);
  }
  
  // "2 years", "1 year"
  const yearsMatch = expValue.match(/^(\d+)\s*years?$/i);
  if (yearsMatch) {
    return parseInt(yearsMatch[1], 10) * 12;
  }
  
  // "<3" or ">3" shorthand
  if (expValue === '<3' || expValue.includes('under 3')) {
    return 0;
  }
  
  if (expValue === '>3' || expValue.includes('over 3')) {
    return 3;
  }
  
  // "3 Months" - exact numeric months
  const exactMonthsMatch = expValue.match(/(\d+)\s*months?/i);
  if (exactMonthsMatch) {
    return parseInt(exactMonthsMatch[1], 10);
  }
  
  return null;
};

/**
 * Categorizes an applicant based on CDL, age, and experience
 * D: Experienced Driver - CDL + Age + 3+ months exp
 * SC: New CDL Holder - CDL + Age + <3 months exp
 * SR: Student Ready - No CDL + Age + <3 months exp
 * N/A: All other combinations
 */
export const getApplicantCategory = (app: AnyApplication): ApplicationCategory => {
  const hasCdl = app.cdl?.toLowerCase() === 'yes';
  const hasAge = app.age?.toLowerCase() === 'yes';
  
  const experienceMonths = parseExperienceMonths(app);
  const hasMoreThan3MonthsExp = experienceMonths !== null && experienceMonths >= 3;
  const hasLessThan3MonthsExp = experienceMonths !== null && experienceMonths < 3;

  // D: Experienced Driver - CDL + Age + 3+ months exp
  if (hasCdl && hasAge && hasMoreThan3MonthsExp) {
    return { code: 'D', label: 'Experienced Driver', color: 'bg-green-100 text-green-800' };
  }
  
  // SC: New CDL Holder - CDL + Age + <3 months exp
  if (hasCdl && hasAge && hasLessThan3MonthsExp) {
    return { code: 'SC', label: 'New CDL Holder', color: 'bg-blue-100 text-blue-800' };
  }
  
  // SR: Student Ready - No CDL + Age + <3 months exp
  if (!hasCdl && hasAge && hasLessThan3MonthsExp) {
    return { code: 'SR', label: 'Student Ready', color: 'bg-yellow-100 text-yellow-800' };
  }

  // N/A: All other combinations
  return { code: 'N/A', label: 'Uncategorized', color: 'bg-gray-100 text-gray-800' };
};

/**
 * Formats a date string for display
 */
export const formatApplicationDate = (dateString?: string): string => {
  if (!dateString) return 'Not provided';
  
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Formats a short date for card display
 */
export const formatShortDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString();
};

/**
 * Source display mapping: converts raw internal source codes to human-readable labels
 */
const SOURCE_DISPLAY_MAP: Record<string, string> = {
  'hayes-re-garrison-inbound': 'R.E. Garrison',
  'hayes-garrison-zapier': 'R.E. Garrison (Zapier)',
  'ziprecruiter-webhook': 'ZipRecruiter',
  'ziprecruiter': 'ZipRecruiter',
  'cdl-jobcast': 'CDL JobCast',
  'cdl-jobcast-inbound': 'CDL JobCast',
  'direct application': 'Direct',
  'direct': 'Direct',
  'meta': 'Meta Ads',
  'facebook': 'Facebook',
  'instagram': 'Instagram',
  'tiktok': 'TikTok',
  'indeed': 'Indeed',
  'linkedin': 'LinkedIn',
  'google': 'Google',
  'zapier': 'Zapier',
  'referral': 'Referral',
  'submit-application': 'Direct Apply',
  'inbound-applications': 'Inbound API',
};

/**
 * Returns a human-readable source label for display in the UI
 */
export const getSourceDisplay = (app: AnyApplication): string => {
  const rawSource = (app.source || '').trim();
  const normalizedSource = rawSource.toLowerCase();

  // Check exact match first
  if (SOURCE_DISPLAY_MAP[normalizedSource]) {
    return SOURCE_DISPLAY_MAP[normalizedSource];
  }

  // Check partial matches for compound source strings
  for (const [key, label] of Object.entries(SOURCE_DISPLAY_MAP)) {
    if (normalizedSource.includes(key)) {
      return label;
    }
  }

  // Fall back to utm_source if available and source is empty/generic
  if ((!rawSource || normalizedSource === 'web' || normalizedSource === 'other') && app.utm_source) {
    return app.utm_source;
  }

  // Return raw source with basic formatting, or 'Unknown'
  return rawSource || 'Unknown';
};

/**
 * Returns structured attribution data for detail views
 */
export interface AttributionSummary {
  sourceLabel: string;
  rawSource: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  referralSource: string | null;
  howDidYouHear: string | null;
  hasAttribution: boolean;
}

export const getAttributionSummary = (app: AnyApplication): AttributionSummary => {
  const sourceLabel = getSourceDisplay(app);
  const utmSource = app.utm_source || null;
  const utmMedium = app.utm_medium || null;
  const utmCampaign = app.utm_campaign || null;
  const referralSource = app.referral_source || null;
  const howDidYouHear = app.how_did_you_hear || null;

  return {
    sourceLabel,
    rawSource: app.source || null,
    utmSource,
    utmMedium,
    utmCampaign,
    referralSource,
    howDidYouHear,
    hasAttribution: !!(utmSource || utmMedium || utmCampaign || referralSource || howDidYouHear),
  };
};
