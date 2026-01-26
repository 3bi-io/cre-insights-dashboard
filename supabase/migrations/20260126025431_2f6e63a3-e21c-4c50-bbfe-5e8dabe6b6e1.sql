-- Cleanup applicant email formatting (one-time data fix)

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