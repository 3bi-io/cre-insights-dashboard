/**
 * Email Normalization and Validation Utilities
 * 
 * Handles spoken email formats from voice agents (ElevenLabs)
 * and ensures properly formatted email addresses before storage.
 */

/**
 * Convert spoken email format to standard email format
 * Handles: "at" → "@", "dot" → ".", spaces removal, case normalization
 * 
 * @example
 * normalizeSpokenEmail("CodyForbes at gmail dot com") → "codyforbes@gmail.com"
 * normalizeSpokenEmail("TruckingJerryH at gmail.com") → "truckingjerryh@gmail.com"
 * normalizeSpokenEmail('{"data_collection_id":...}') → null (JSON object)
 */
export function normalizeSpokenEmail(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  
  let email = input.trim().toLowerCase();
  
  // Skip if it's a JSON object string
  if (email.startsWith('{') || email.includes('data_collection_id')) {
    return null;
  }
  
  // Replace spoken patterns with symbols
  // Handle " at " → "@" (with spaces - most common spoken format)
  email = email.replace(/\s+at\s+/gi, '@');
  // Handle standalone "at" word → "@" (boundary match)
  email = email.replace(/\bat\b/gi, '@');
  
  // Handle " dot " → "." (with spaces - most common spoken format)
  email = email.replace(/\s+dot\s+/gi, '.');
  // Handle standalone "dot" word → "." (boundary match)
  email = email.replace(/\bdot\b/gi, '.');
  
  // Remove any remaining spaces
  email = email.replace(/\s+/g, '');
  
  // Basic validation: must contain @ and at least one .
  if (!email.includes('@') || !email.includes('.')) {
    return null;
  }
  
  // Must have content before @, between @ and ., and after final .
  const atIndex = email.indexOf('@');
  const lastDotIndex = email.lastIndexOf('.');
  
  // Validate structure: user@domain.tld
  if (atIndex < 1 || lastDotIndex <= atIndex + 1 || lastDotIndex === email.length - 1) {
    return null;
  }
  
  return email;
}

/**
 * Check if email is valid format using standard regex
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Normalize and validate an email, returning null if invalid
 * Combines normalization with validation in one step
 */
export function normalizeAndValidateEmail(input: string): string | null {
  const normalized = normalizeSpokenEmail(input);
  if (normalized && isValidEmail(normalized)) {
    return normalized;
  }
  
  // If normalization didn't work but original is already valid, use it
  if (input && isValidEmail(input.trim().toLowerCase())) {
    return input.trim().toLowerCase();
  }
  
  return null;
}
