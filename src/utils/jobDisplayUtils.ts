/**
 * Utility functions for displaying job information consistently across the app
 */

/**
 * Get the display name for a company/client
 * Falls back to organization name if client is "Unassigned" or missing
 */
export const getDisplayCompanyName = (job: {
  clients?: { name?: string | null } | null;
  client?: string | null;
  organizations?: { name?: string | null } | null;
}): string => {
  const clientName = job.clients?.name || job.client;
  
  // If client name is "Unassigned" or empty, use organization name
  if (!clientName || clientName === 'Unassigned') {
    return job.organizations?.name || 'Company';
  }
  
  return clientName;
};
