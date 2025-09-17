-- Remove discontinued/non-functioning job platforms
-- Stack Overflow Jobs discontinued in March 2022
-- Neuvoo acquired by Indeed and no longer independent
-- AngelList rebranded to Wellfound with different model
-- JobisJob has limited functionality
-- Workable is an ATS system not a job board
-- USAJobs is government-specific, not general use

DELETE FROM platforms WHERE name IN (
  'Stack Overflow Jobs',
  'Neuvoo', 
  'AngelList',
  'JobisJob',
  'Jooble',
  'Workable',
  'USAJobs'
);

-- Update any job_platform_associations that might reference these platforms
DELETE FROM job_platform_associations 
WHERE platform_id IN (
  SELECT id FROM platforms 
  WHERE name IN ('Stack Overflow Jobs', 'Neuvoo', 'AngelList', 'JobisJob', 'Jooble', 'Workable', 'USAJobs')
);