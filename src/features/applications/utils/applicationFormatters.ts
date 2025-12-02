import { Application, ApplicationCategory } from '../types';

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
export const getApplicantName = (app: Application): string => {
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
export const getApplicantEmail = (app: Application): string => {
  return app.applicant_email || 'No email provided';
};

/**
 * Formats the location display for an applicant
 */
export const getApplicantLocation = (app: Application): string => {
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
export const getClientName = (app: Application): string | null => {
  if (isOrphanedApplication(app.job_listing_id)) {
    return null;
  }
  const jobListing = app.job_listings as any;
  return jobListing?.clients?.name || jobListing?.client || null;
};

/**
 * Gets the job title from application
 */
export const getJobTitle = (app: Application): string => {
  if (isOrphanedApplication(app.job_listing_id)) {
    return 'Job Removed';
  }
  return app.job_listings?.title || app.job_listings?.job_title || 'Unknown Position';
};

/**
 * Parses experience from application data
 * Handles multiple formats: numeric months, text descriptions, legacy data
 * Returns number of months or null if unable to determine
 */
export const parseExperienceMonths = (app: Application): number | null => {
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
export const getApplicantCategory = (app: Application): ApplicationCategory => {
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
