-- Fix spoken format emails (convert "at" to "@" and "dot" to ".")
UPDATE applications
SET applicant_email = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(applicant_email, '\s+', '', 'g'),
          'at', '@', 'gi'
        ),
        'dot', '.', 'gi'
      ),
      '@', '@'
    ),
    '\s+', ''
  )
)
WHERE source = 'ElevenLabs'
  AND (applicant_email LIKE '% at %' OR applicant_email LIKE '%at %' OR applicant_email LIKE '% dot %' OR applicant_email LIKE '%dot %');

-- Set JSON objects to NULL
UPDATE applications
SET applicant_email = NULL
WHERE source = 'ElevenLabs'
  AND applicant_email LIKE '%data_collection_id%';

-- Set invalid emails (missing @) to NULL
UPDATE applications
SET applicant_email = NULL
WHERE source = 'ElevenLabs'
  AND applicant_email IS NOT NULL
  AND applicant_email NOT LIKE '%@%';