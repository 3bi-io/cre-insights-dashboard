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

/**
 * Format salary range for display
 */
export const formatSalary = (
  min: number | null,
  max: number | null,
  type: string | null
): string | null => {
  if (!min && !max) return null;
  const formatAmount = (amount: number) => {
    if (type === 'hourly') return `$${amount}/hr`;
    if (type === 'yearly') return `$${amount.toLocaleString()}/yr`;
    return `$${amount.toLocaleString()}`;
  };
  if (min && max) return `${formatAmount(min)} - ${formatAmount(max)}`;
  return formatAmount(min || max || 0);
};
