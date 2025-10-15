import { Application, ApplicationFilters } from '../types';
import { getApplicantName, getApplicantEmail, getJobTitle, getApplicantCategory } from './applicationFormatters';

/**
 * Filters applications based on multiple criteria
 */
export const filterApplications = (
  applications: Application[], 
  filters: ApplicationFilters
): Application[] => {
  const {
    searchTerm,
    categoryFilter,
    sourceFilter,
    organizationFilter,
    statusFilter
  } = filters;

  return applications?.filter(app => {
    const applicantName = getApplicantName(app);
    const applicantEmail = getApplicantEmail(app);
    const jobTitle = getJobTitle(app);
    const category = getApplicantCategory(app);
    const source = app.source || 'Other';
    const jobListing = app.job_listings as any;
    const organizationId = jobListing?.organization_id;
    
    const matchesSearch = (
      applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicantEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const matchesCategory = categoryFilter === 'all' || category.code === categoryFilter;
    const matchesSource = sourceFilter === 'all' || source === sourceFilter;
    const matchesOrganization = !organizationFilter || organizationFilter === 'all' || organizationId === organizationFilter;
    const matchesStatus = !statusFilter || statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesSource && matchesOrganization && matchesStatus;
  }) || [];
};

/**
 * Gets unique sources from applications
 */
export const getUniqueSources = (applications: Application[]): string[] => {
  const sources = new Set<string>();
  applications?.forEach(app => {
    if (app.source) {
      sources.add(app.source);
    }
  });
  return Array.from(sources).sort();
};

/**
 * Gets unique organizations from applications
 */
export const getUniqueOrganizations = (applications: Application[]): Array<{ id: string; name: string }> => {
  const orgMap = new Map<string, string>();
  applications?.forEach(app => {
    const jobListing = app.job_listings as any;
    const orgId = jobListing?.organization_id;
    const orgName = jobListing?.organization?.name;
    if (orgId && orgName && !orgMap.has(orgId)) {
      orgMap.set(orgId, orgName);
    }
  });
  return Array.from(orgMap.entries()).map(([id, name]) => ({ id, name }));
};
