
-- Update job_listings to fill description column based on job_id where description is null or empty
UPDATE public.job_listings 
SET description = CASE 
  WHEN job_description IS NOT NULL AND job_description != '' THEN job_description
  WHEN job_title IS NOT NULL AND job_title != '' THEN 
    'Job Position: ' || job_title || 
    CASE 
      WHEN location IS NOT NULL AND location != '' THEN ' | Location: ' || location
      WHEN city IS NOT NULL AND state IS NOT NULL THEN ' | Location: ' || city || ', ' || state
      ELSE ''
    END ||
    CASE 
      WHEN salary_min IS NOT NULL OR salary_max IS NOT NULL THEN 
        ' | Salary: ' || 
        CASE 
          WHEN salary_min IS NOT NULL AND salary_max IS NOT NULL THEN 
            '$' || salary_min || ' - $' || salary_max ||
            CASE WHEN salary_type IS NOT NULL THEN ' (' || salary_type || ')' ELSE '' END
          WHEN salary_min IS NOT NULL THEN 
            '$' || salary_min || '+' ||
            CASE WHEN salary_type IS NOT NULL THEN ' (' || salary_type || ')' ELSE '' END
          WHEN salary_max IS NOT NULL THEN 
            'Up to $' || salary_max ||
            CASE WHEN salary_type IS NOT NULL THEN ' (' || salary_type || ')' ELSE '' END
        END
      ELSE ''
    END
  WHEN title IS NOT NULL AND title != '' THEN title
  ELSE 'Job listing (ID: ' || COALESCE(job_id, id::text) || ')'
END
WHERE description IS NULL OR description = '';
