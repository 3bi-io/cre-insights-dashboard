

# Cleanup Applicant Email Formatting

## Problem Summary

Analysis of the `applications` table reveals the following remaining data quality issues:

| Issue Type | Count | Example | Action Required |
|------------|-------|---------|-----------------|
| JSON object stored as email | 1 | `{"d@a_collection_id":"internetemailaddress"...}` | Set to NULL |
| Uppercase emails | 171 | `TruckingJerry@yahoo.com` | Convert to lowercase |
| Typo domains (`.con`) | 2 | `Newsuccess23@gmail.con` | Flag for manual review |
| Spoken format ("at"/"dot") | 0 | N/A | Already fixed |
| Missing @ symbol | 0 | N/A | None found |

**Good news:** The spoken format normalization from the previous fix is working - no new issues detected.

---

## Solution

Run a one-time SQL data cleanup to normalize all existing emails.

---

## Implementation

### Single SQL Migration

Execute the following SQL to clean up existing records:

```sql
-- Step 1: Set JSON objects to NULL (unusable data)
UPDATE applications
SET applicant_email = NULL,
    updated_at = NOW()
WHERE applicant_email LIKE '%{%'
   OR applicant_email LIKE '%data_collection%';

-- Step 2: Normalize all emails to lowercase
UPDATE applications
SET applicant_email = LOWER(applicant_email),
    updated_at = NOW()
WHERE applicant_email IS NOT NULL
  AND applicant_email != LOWER(applicant_email);

-- Step 3: Flag typo domains for manual review (add note)
UPDATE applications
SET notes = COALESCE(notes, '') || ' [REVIEW: Email domain typo detected - .con instead of .com]',
    updated_at = NOW()
WHERE applicant_email LIKE '%.con'
  AND (notes IS NULL OR notes NOT LIKE '%domain typo%');
```

---

## Expected Results

| Metric | Before | After |
|--------|--------|-------|
| JSON garbage emails | 1 | 0 (set to NULL) |
| Uppercase emails | 171 | 0 (normalized) |
| Typo domains | 2 | 2 (flagged for review) |
| Valid lowercase emails | ~400 | ~571 |

---

## Why Not Auto-Fix Typo Domains?

The 2 emails ending in `.con` instead of `.com` cannot be safely auto-corrected:
- `Newsuccess23@gmail.con` → likely `@gmail.com`
- `tlmindset59@gmail.con` → likely `@gmail.com`

While these are probably typos, changing them automatically could result in sending emails to the wrong person. These are flagged in the notes field for a recruiter to verify with the applicant.

---

## Files to Modify

No code changes required - this is a data-only cleanup via SQL migration.

---

## Verification Query

After the migration, run this to confirm cleanup:

```sql
SELECT 
  COUNT(*) FILTER (WHERE applicant_email LIKE '%{%') as json_objects,
  COUNT(*) FILTER (WHERE applicant_email != LOWER(applicant_email) AND applicant_email NOT LIKE '%{%') as uppercase,
  COUNT(*) FILTER (WHERE applicant_email IS NOT NULL AND applicant_email LIKE '%@%.%') as valid_emails
FROM applications;
```

Expected result: `json_objects: 0, uppercase: 0, valid_emails: ~571`

