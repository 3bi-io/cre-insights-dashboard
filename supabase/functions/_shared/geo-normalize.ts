/**
 * Shared geo normalization utilities for inbound application processing.
 * Mirrors the state normalization logic from sync-cdl-feeds and adds zip sanitization.
 */

// US state full-name → 2-letter abbreviation lookup
const STATE_ABBREVIATIONS: Record<string, string> = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
  'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
  'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
  'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
  'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
  'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
  'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
  'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
  'wisconsin': 'WI', 'wyoming': 'WY', 'district of columbia': 'DC',
};

/**
 * Normalize a state value to its 2-letter abbreviation.
 * Returns the original value if already a valid abbreviation or unrecognized.
 * Returns null for falsy input.
 */
export function normalizeState(state: string | null | undefined): string | null {
  if (!state) return null;
  const trimmed = state.trim();
  if (!trimmed) return null;

  // Already a valid 2-letter abbreviation?
  if (trimmed.length === 2) {
    const upper = trimmed.toUpperCase();
    // Verify it's a real state abbreviation
    const isValid = Object.values(STATE_ABBREVIATIONS).includes(upper);
    if (isValid) return upper;
  }

  // Look up full name → abbreviation
  const abbr = STATE_ABBREVIATIONS[trimmed.toLowerCase()];
  return abbr || trimmed; // pass through if unrecognized
}

/**
 * Sanitize a zip code value.
 * - Strips non-alphanumeric characters
 * - Accepts 5-digit or 5+4 US zip codes
 * - Returns null for invalid/placeholder values (e.g., "XXXXXXX", "00000")
 */
export function sanitizeZip(zip: string | null | undefined): string | null {
  if (!zip) return null;
  const trimmed = zip.trim();
  if (!trimmed) return null;

  // Strip everything except digits and hyphens
  const cleaned = trimmed.replace(/[^0-9-]/g, '');

  // Match 5-digit or 5+4 format
  const match = cleaned.match(/^(\d{5})(-\d{4})?$/);
  if (!match) return null;

  // Reject all-zeros placeholder
  if (match[1] === '00000') return null;

  return match[0];
}
