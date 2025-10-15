import { Application, ApplicationCategory } from '../types';

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
  const jobListing = app.job_listings as any;
  return jobListing?.clients?.name || jobListing?.client || null;
};

/**
 * Gets the job title from application
 */
export const getJobTitle = (app: Application): string => {
  return app.job_listings?.title || app.job_listings?.job_title || 'Unknown Position';
};

/**
 * Categorizes an applicant based on CDL, age, and experience
 */
export const getApplicantCategory = (app: Application): ApplicationCategory => {
  const hasCdl = app.cdl?.toLowerCase() === 'yes';
  const hasAge = app.age?.toLowerCase() === 'yes';
  const expValue = app.exp?.toLowerCase() || '';
  
  const hasMoreThan3MonthsExp = 
    expValue.includes('more than 3') || 
    expValue.includes('>3') || 
    expValue.includes('over 3') ||
    expValue.includes('4') || expValue.includes('5') || expValue.includes('6') ||
    expValue.includes('year') || expValue.includes('experienced');
  
  const hasLessThan3MonthsExp = 
    expValue.includes('less than 3') || 
    expValue.includes('<3') || 
    expValue.includes('under 3') ||
    expValue.includes('1') || expValue.includes('2') || 
    expValue.includes('beginner') || expValue.includes('new');

  if (hasCdl && hasAge && hasMoreThan3MonthsExp) {
    return { code: 'D', label: 'Experienced Driver', color: 'bg-green-100 text-green-800' };
  }
  
  if (hasCdl && hasAge && hasLessThan3MonthsExp) {
    return { code: 'SC', label: 'New CDL Holder', color: 'bg-blue-100 text-blue-800' };
  }
  
  if (!hasCdl && hasAge && hasLessThan3MonthsExp) {
    return { code: 'SR', label: 'Student Ready', color: 'bg-yellow-100 text-yellow-800' };
  }

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
