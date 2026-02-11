/**
 * Phone Number Normalization Utilities for Edge Functions
 * Handles spoken phone numbers and normalizes to E.164 format
 */

const WORD_TO_DIGIT: Record<string, string> = {
  'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
  'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
  'oh': '0', 'o': '0',
};

/**
 * Convert spoken number words to digits
 * "eight one seven seven five seven two eight two eight" → "8177572828"
 */
function spokenToDigits(input: string): string {
  const words = input.toLowerCase().replace(/-/g, ' ').split(/\s+/);
  let result = '';
  for (const word of words) {
    if (WORD_TO_DIGIT[word]) {
      result += WORD_TO_DIGIT[word];
    } else if (/^\d$/.test(word)) {
      result += word;
    }
  }
  return result;
}

/**
 * Normalize a phone value (which may be spoken words or digits) to E.164 format
 * Returns null if the input can't be normalized to a valid phone number
 */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone || typeof phone !== 'string') return null;

  let digits = phone.replace(/\D/g, '');

  // If fewer than 7 digits, it might be spoken words
  if (digits.length < 7) {
    const parsed = spokenToDigits(phone);
    if (parsed.length >= 10) {
      digits = parsed;
    } else {
      return null;
    }
  }

  // Normalize to 10-digit US number
  if (digits.length === 10) {
    return `+1${digits}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  } else if (digits.length > 11) {
    return `+1${digits.slice(-10)}`;
  }

  return null;
}

/**
 * Check if a phone string contains spoken word digits that need normalization
 */
export function containsSpokenDigits(input: string): boolean {
  if (!input) return false;
  return /\b(zero|one|two|three|four|five|six|seven|eight|nine|oh)\b/i.test(input);
}
