/**
 * Normalizes phone numbers to E.164 format (+1XXXXXXXXXX for US numbers)
 * Handles various input formats and ensures consistent output
 */
export function normalizePhoneNumber(phone: string | null | undefined): string | null {
  if (!phone || typeof phone !== 'string') {
    return null;
  }

  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Handle empty or invalid inputs
  if (!digitsOnly || digitsOnly.length < 10) {
    return null;
  }

  // Handle US numbers
  if (digitsOnly.length === 10) {
    // 10 digits - add +1 country code
    return `+1${digitsOnly}`;
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    // 11 digits starting with 1 - already has country code
    return `+${digitsOnly}`;
  } else if (digitsOnly.length === 11 && !digitsOnly.startsWith('1')) {
    // 11 digits not starting with 1 - assume it's a 10-digit number with extra digit
    return `+1${digitsOnly.slice(-10)}`;
  } else if (digitsOnly.length > 11) {
    // More than 11 digits - take last 10 and add +1
    return `+1${digitsOnly.slice(-10)}`;
  }

  // Fallback for edge cases
  return null;
}

/**
 * Formats a normalized phone number for display
 * Input: +1XXXXXXXXXX
 * Output: (XXX) XXX-XXXX
 */
export function formatPhoneForDisplay(phone: string | null | undefined): string {
  if (!phone) return '';
  
  const normalized = normalizePhoneNumber(phone);
  if (!normalized || !normalized.startsWith('+1')) {
    return phone || '';
  }

  const digits = normalized.slice(2); // Remove +1
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  return phone;
}

/**
 * Validates if a phone number is properly normalized
 */
export function isNormalizedPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  return /^\+1\d{10}$/.test(phone);
}