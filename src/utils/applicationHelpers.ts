/**
 * @deprecated This file is maintained for backwards compatibility.
 * Import from '@/features/applications/utils/applicationFormatters' instead.
 */

// Re-export all formatters from the canonical source
export {
  getApplicantName,
  getApplicantEmail,
  getApplicantLocation,
  getClientName,
  getApplicantCategory,
  getJobTitle,
  getJobDisplayTitle,
} from '@/features/applications/utils/applicationFormatters';

// Import for internal use in stats and filter functions
import { 
  getApplicantName, 
  getApplicantEmail, 
  getApplicantCategory,
  getJobTitle 
} from '@/features/applications/utils/applicationFormatters';

/**
 * Legacy filter function that accepts positional parameters
 * @deprecated Use the object-based filter from applicationFilters.ts instead
 */
export const filterApplications = (
  applications: any[], 
  searchTerm: string, 
  categoryFilter: string, 
  sourceFilter: string, 
  organizationFilter?: string
): any[] => {
  return applications?.filter(app => {
    const applicantName = getApplicantName(app);
    const applicantEmail = getApplicantEmail(app);
    const jobTitle = getJobTitle(app);
    const category = getApplicantCategory(app);
    const source = app.source || 'Other';
    const organizationId = app.job_listings?.organization_id;
    
    const matchesSearch = (
      applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicantEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const matchesCategory = categoryFilter === 'all' || category.code === categoryFilter;
    const matchesSource = sourceFilter === 'all' || source === sourceFilter;
    const matchesOrganization = !organizationFilter || organizationFilter === 'all' || organizationId === organizationFilter;
    
    return matchesSearch && matchesCategory && matchesSource && matchesOrganization;
  }) || [];
};

/**
 * Calculates status counts from applications array
 */
export const getStatusCounts = (applications: any[]) => {
  return applications?.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
};

/**
 * Calculates category counts from applications array
 */
export const getCategoryCounts = (applications: any[]) => {
  return applications?.reduce((acc, app) => {
    const category = getApplicantCategory(app);
    acc[category.code] = (acc[category.code] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
};

/**
 * Determines if an application was enriched with full detailed form data.
 */
export const getFormType = (application: any): 'Quick' | 'Detailed' => {
  const detailedFields = [
    application.employment_history,
    application.ssn,
    application.date_of_birth,
    application.emergency_contact_name,
    application.convicted_felony,
    application.military_service,
    application.medical_card_expiration,
  ];

  return detailedFields.some(field => {
    if (field === null || field === undefined || field === '') return false;
    if (Array.isArray(field)) return field.length > 0;
    if (typeof field === 'object') return Object.keys(field).length > 0;
    return true;
  }) ? 'Detailed' : 'Quick';
};
