/**
 * Utility functions for displaying job information consistently across the app
 */

/**
 * Get the display name for a company/client
 * Returns only the client name for privacy - organization info is not exposed
 */
export const getDisplayCompanyName = (job: {
  clients?: { name?: string | null } | null;
  client?: string | null;
}): string => {
  const clientName = job.clients?.name || job.client;
  
  // Return client name only, no org prefix for privacy
  if (!clientName || clientName === 'Unassigned') {
    return 'Company';  // Generic fallback
  }
  
  return clientName;
};
