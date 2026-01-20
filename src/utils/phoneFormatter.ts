/**
 * Phone number formatting utilities for US phone numbers
 * Handles autofill edge cases where country codes may be included
 */

/**
 * Formats phone number for display as user types
 * Handles US numbers with or without country code
 * Uses LAST 10 digits to match backend normalization (phoneNormalizer.ts)
 */
export function formatPhoneInput(value: string): string {
  // Extract all digits
  const allDigits = value.replace(/\D/g, '');
  
  if (allDigits.length === 0) return '';
  
  // For US numbers, handle country code prefix
  // This handles: +15551234567, 15551234567, etc.
  let digits = allDigits;
  if (allDigits.length > 10) {
    // Check if it looks like a US number with country code (11 digits starting with 1)
    if (allDigits.length === 11 && allDigits.startsWith('1')) {
      digits = allDigits.slice(1); // Remove leading 1
    } else if (allDigits.length > 11) {
      // For longer numbers, take last 10 digits
      digits = allDigits.slice(-10);
    }
  }
  
  // Format as (XXX) XXX-XXXX
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

/**
 * Checks if input had a country code that was reformatted
 */
export function wasCountryCodeDetected(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length > 10;
}

/**
 * Validates phone has enough digits for a US number
 */
export function isValidUSPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 10;
}
