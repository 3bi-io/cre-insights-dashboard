/**
 * Shared ATS constants
 */

/** R.E. Garrison client ID — the only client allowed for Double Nickel ATS */
export const DOUBLENICKEL_ALLOWED_CLIENT_ID = 'be8b645e-d480-4c22-8e75-b09a7fc1db7a';

/** Double Nickel ATS system slug */
export const DOUBLENICKEL_SLUG = 'doublenickel';

/**
 * Check if a Double Nickel connection is valid (must belong to R.E. Garrison)
 */
export function isDoubleNickelAllowed(atsSlug: string, clientId: string | null | undefined): boolean {
  if (atsSlug !== DOUBLENICKEL_SLUG) return true;
  return clientId === DOUBLENICKEL_ALLOWED_CLIENT_ID;
}
