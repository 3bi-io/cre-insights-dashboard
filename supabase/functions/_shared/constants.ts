/**
 * Platform-wide constants for Supabase Edge Functions
 */

/** Default IANA timezone for the platform (US Central Time) */
export const DEFAULT_TIMEZONE = 'America/Chicago';

/** Default business hours */
export const DEFAULT_BUSINESS_HOURS = {
  START: '09:00',
  END: '16:30',
  DAYS: [1, 2, 3, 4, 5], // Mon–Fri
} as const;
