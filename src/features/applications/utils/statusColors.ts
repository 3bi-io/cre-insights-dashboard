/**
 * Centralized status color definitions for application statuses
 * Provides consistent styling across all application views
 */

export type ApplicationStatusType = 
  | 'pending'
  | 'follow_up'
  | 'reviewed'
  | 'interviewed'
  | 'interview_scheduled'
  | 'offer_extended'
  | 'hired'
  | 'rejected'
  | 'withdrawn';

/**
 * Status colors for admin/recruiter views (dark theme compatible)
 * Uses opacity-based styling for modern appearance
 */
export const STATUS_COLORS_ADMIN: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  follow_up: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  reviewed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  interviewed: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  interview_scheduled: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  offer_extended: 'bg-green-500/20 text-green-400 border-green-500/30',
  hired: 'bg-green-500/20 text-green-400 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  withdrawn: 'bg-muted text-muted-foreground border-muted',
};

/**
 * Status colors for candidate-facing views
 * Uses softer, more accessible color combinations
 */
export const STATUS_COLORS_CANDIDATE: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  follow_up: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  reviewed: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  interviewed: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  interview_scheduled: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  offer_extended: 'bg-green-500/10 text-green-600 border-green-500/20',
  hired: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-600 border-red-500/20',
  withdrawn: 'bg-muted text-muted-foreground border-muted',
};

/**
 * Status colors for dialogs and detail views (solid backgrounds)
 */
export const STATUS_COLORS_DIALOG: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  follow_up: 'bg-orange-100 text-orange-800',
  reviewed: 'bg-blue-100 text-blue-800',
  interviewed: 'bg-purple-100 text-purple-800',
  interview_scheduled: 'bg-purple-100 text-purple-800',
  offer_extended: 'bg-green-100 text-green-800',
  hired: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  withdrawn: 'bg-gray-100 text-gray-800',
};

/**
 * Gets the appropriate status color class based on context
 */
export const getStatusColor = (
  status: string, 
  context: 'admin' | 'candidate' | 'dialog' = 'admin'
): string => {
  const colorMap = {
    admin: STATUS_COLORS_ADMIN,
    candidate: STATUS_COLORS_CANDIDATE,
    dialog: STATUS_COLORS_DIALOG,
  };
  
  return colorMap[context][status] || 'bg-gray-100 text-gray-800';
};

/**
 * Status labels for display
 */
export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending Review',
  follow_up: 'Follow-up',
  reviewed: 'Reviewed',
  interviewed: 'Interviewed',
  interview_scheduled: 'Interview Scheduled',
  offer_extended: 'Offer Extended',
  hired: 'Hired',
  rejected: 'Not Selected',
  withdrawn: 'Withdrawn',
};

/**
 * Gets the display label for a status
 */
export const getStatusLabel = (status: string): string => {
  return STATUS_LABELS[status] || status;
};
