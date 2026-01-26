
# Fix Voice Agent Email Normalization and Validation

## Problem Summary

Voice-collected email addresses from ElevenLabs are being stored with data quality issues:

| Issue | Count | Impact |
|-------|-------|--------|
| Spoken format ("at" / "dot") | 12 | Cannot send emails |
| JSON objects instead of strings | 3 | Completely unusable |
| Missing @ symbol | 2 | Invalid email format |
| **Total Malformed** | **17 (41%)** | **Broken email communications** |

## Solution Overview

1. Create a robust `normalizeSpokenEmail()` utility function
2. Add pre-storage email validation
3. Update both voice edge functions to normalize before storing
4. Run a one-time database cleanup for existing malformed records

---

## Implementation Plan

### Phase 1: Create Email Normalization Utility

**New file: `supabase/functions/_shared/email-utils.ts`**

Create a dedicated utility module with:

```typescript
/**
 * Convert spoken email format to standard email format
 * Handles: "at" → "@", "dot" → ".", spaces removal, case normalization
 */
export function normalizeSpokenEmail(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  
  let email = input.trim().toLowerCase();
  
  // Skip if it's a JSON object string
  if (email.startsWith('{') || email.includes('data_collection_id')) {
    return null;
  }
  
  // Replace spoken patterns with symbols
  // Handle " at " → "@" (with spaces)
  email = email.replace(/\s+at\s+/gi, '@');
  // Handle "at " → "@" (partial spaces)
  email = email.replace(/\bat\b/gi, '@');
  
  // Handle " dot " → "." (with spaces)
  email = email.replace(/\s+dot\s+/gi, '.');
  // Handle "dot " → "." (partial spaces)  
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
  if (atIndex < 1 || lastDotIndex <= atIndex + 1 || lastDotIndex === email.length - 1) {
    return null;
  }
  
  return email;
}

/**
 * Check if email is valid format
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

### Phase 2: Update getValue Helper in Both Edge Functions

**Files:**
- `supabase/functions/elevenlabs-conversation-webhook/index.ts`
- `supabase/functions/sync-voice-applications/index.ts`

**Changes to getValue function:**

```typescript
// Import at top of file
import { normalizeSpokenEmail, isValidEmail } from "../_shared/email-utils.ts";

// Enhanced getValue with email normalization option
function getValue(
  dataCollectionResults: Record<string, unknown>, 
  keys: string[],
  options?: { normalizeEmail?: boolean }
): string | undefined {
  for (const key of keys) {
    const val = dataCollectionResults[key];
    if (val !== undefined && val !== null) {
      let result: string;
      
      if (typeof val === 'object') {
        const objVal = val as Record<string, unknown>;
        // Extract actual value, skip if null
        const extractedValue = objVal.value || objVal.answer || objVal.text;
        if (extractedValue === null || extractedValue === undefined) {
          continue; // Skip to next key instead of returning JSON
        }
        result = String(extractedValue).trim();
      } else {
        result = String(val).trim();
      }
      
      // Apply email normalization if requested
      if (options?.normalizeEmail) {
        const normalized = normalizeSpokenEmail(result);
        if (normalized && isValidEmail(normalized)) {
          return normalized;
        }
        // If normalization failed but original looks like an email, try it
        if (isValidEmail(result)) {
          return result.toLowerCase();
        }
        continue; // Skip invalid email, try next key
      }
      
      return result;
    }
  }
  return undefined;
}
```

### Phase 3: Update Email Extraction Calls

**In both edge functions, change:**

```typescript
// Before
const email = getValue(dataCollectionResults, ['InternetEmailAddress', 'email', 'Email', 'email_address']);

// After  
const email = getValue(
  dataCollectionResults, 
  ['InternetEmailAddress', 'email', 'Email', 'email_address'],
  { normalizeEmail: true }
);
```

### Phase 4: Database Cleanup (One-Time Fix)

Run SQL migration to fix existing malformed records:

```sql
-- Update spoken format emails
UPDATE applications
SET applicant_email = LOWER(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(applicant_email, ' at ', '@'),
        ' dot ', '.'
      ),
      'at ', '@'
    ),
    ' dot', '.'
  )
)
WHERE source = 'ElevenLabs'
  AND (applicant_email LIKE '% at %' OR applicant_email LIKE '% dot %');

-- Set JSON objects to NULL (will need manual review)
UPDATE applications
SET applicant_email = NULL
WHERE source = 'ElevenLabs'
  AND applicant_email LIKE '%data_collection_id%';
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/_shared/email-utils.ts` | Email normalization and validation utilities |

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/elevenlabs-conversation-webhook/index.ts` | Import utilities, update getValue, use normalizeEmail option |
| `supabase/functions/sync-voice-applications/index.ts` | Import utilities, update getValue, use normalizeEmail option |

---

## Test Cases

The normalization function should handle:

| Input | Expected Output |
|-------|-----------------|
| `CodyForbes at gmail dot com` | `codyforbes@gmail.com` |
| `TruckingJerryH at gmail.com` | `truckingjerryh@gmail.com` |
| `rodriguez dot johnny at yahoo dot com` | `rodriguez.johnny@yahoo.com` |
| `codyforbes gmail.com` | `null` (missing @) |
| `{"data_collection_id":...}` | `null` (JSON object) |
| `truckingjerry@yahoo.com` | `truckingjerry@yahoo.com` (unchanged) |
| `555@Yahoo.com` | `555@yahoo.com` (lowercased) |

---

## Expected Outcome

After implementation:

1. All new voice applications will have properly formatted email addresses
2. Spoken formats ("at"/"dot") automatically converted to symbols
3. Invalid/null email values will be stored as NULL (not garbage data)
4. Existing malformed records cleaned up via migration
5. Email communications to applicants will function correctly

---

## Technical Notes

- The fix is backward compatible - valid emails pass through unchanged
- NULL emails still allow application creation (phone is sufficient)
- Logging will indicate when email normalization occurs for debugging
- The utility can be reused by other edge functions in the future
