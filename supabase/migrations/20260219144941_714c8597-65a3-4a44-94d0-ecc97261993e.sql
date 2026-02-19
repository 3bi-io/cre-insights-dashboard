
-- Backfill source from referral_source for existing applications
-- ZipRecruiter
UPDATE applications 
SET source = 'ZipRecruiter'
WHERE source = 'Direct Application' 
AND referral_source ILIKE '%ziprecruiter.com%';

-- Indeed
UPDATE applications 
SET source = 'Indeed'
WHERE source = 'Direct Application' 
AND referral_source ILIKE '%indeed.com%';

-- Facebook
UPDATE applications 
SET source = 'Facebook'
WHERE source = 'Direct Application' 
AND referral_source ILIKE '%facebook.com%';

-- Also backfill from utm_source where available
UPDATE applications
SET source = 'Facebook'
WHERE source = 'Direct Application'
AND utm_source IN ('fb', 'facebook');

UPDATE applications
SET source = 'Google'
WHERE source = 'Direct Application'
AND utm_source IN ('google', 'google_ads', 'gads');

UPDATE applications
SET source = 'Indeed'
WHERE source = 'Direct Application'
AND utm_source = 'indeed';

UPDATE applications
SET source = 'LinkedIn'
WHERE source = 'Direct Application'
AND utm_source = 'linkedin';
