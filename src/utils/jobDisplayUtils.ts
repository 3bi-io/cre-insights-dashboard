/**
 * Utility functions for displaying job information consistently across the app
 */

/**
 * Get the display name for a company/client
 * Falls back to organization name if client is "Unassigned" or missing
 * For CR England, shows "CR England - ClientName" format for sub-clients
 */
export const getDisplayCompanyName = (job: {
  clients?: { name?: string | null } | null;
  client?: string | null;
  organizations?: { name?: string | null } | null;
}): string => {
  const clientName = job.clients?.name || job.client;
  const orgName = job.organizations?.name;
  
  // If client name is "Unassigned" or empty, use organization name
  if (!clientName || clientName === 'Unassigned') {
    return orgName || 'Company';
  }
  
  // For CR England, show "CR England - ClientName" format
  if (orgName === 'CR England' && clientName !== 'CR England') {
    return `CR England - ${clientName}`;
  }
  
  // For Hayes Recruiting Solutions, show "Hayes Recruiting - ClientName" format
  if (orgName === 'Hayes Recruiting Solutions' && clientName !== 'Hayes Recruiting Solutions') {
    return `Hayes Recruiting - ${clientName}`;
  }
  
  return clientName;
};
