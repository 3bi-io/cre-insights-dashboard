-- ============================================================
-- Retroactive UTM Attribution Migration for CDL Job Cast
-- ============================================================

-- 1. Update existing CDL Job Cast applications with UTM data
-- This backfills utm_source, utm_medium, and utm_campaign for historical applications
UPDATE applications 
SET 
  utm_source = 'cdl_jobcast',
  utm_medium = 'job_board',
  utm_campaign = 'cdl_retroactive_' || to_char(COALESCE(applied_at, created_at), 'YYYY') || '_q' || CEIL(EXTRACT(MONTH FROM COALESCE(applied_at, created_at))::numeric / 3)::int,
  updated_at = now()
WHERE source = 'CDL Job Cast'
  AND utm_source IS NULL;

-- 2. Update job listings for Hayes organization to use internal apply URLs with UTM
-- Replace CDL Job Cast external URLs with internal tracked URLs
UPDATE job_listings 
SET 
  apply_url = 'https://ats.me/apply?job_id=' || id::text || 
              '&utm_source=cdl_jobcast&utm_medium=job_board&utm_campaign=' ||
              LOWER(REGEXP_REPLACE(COALESCE(client, 'unknown'), '[^a-zA-Z0-9]+', '_', 'g')) ||
              '_retroactive_' || EXTRACT(YEAR FROM now())::int,
  updated_at = now()
WHERE organization_id = '84214b48-7b51-45bc-ad7f-723bcf50466c'
  AND status = 'active'
  AND (apply_url IS NULL OR apply_url LIKE '%cdljobcast.com%' OR apply_url NOT LIKE '%utm_source=%');

-- 3. Also update inactive jobs that came from CDL Job Cast
UPDATE job_listings 
SET 
  apply_url = 'https://ats.me/apply?job_id=' || id::text || 
              '&utm_source=cdl_jobcast&utm_medium=job_board&utm_campaign=' ||
              LOWER(REGEXP_REPLACE(COALESCE(client, 'unknown'), '[^a-zA-Z0-9]+', '_', 'g')) ||
              '_retroactive_' || EXTRACT(YEAR FROM now())::int,
  updated_at = now()
WHERE organization_id = '84214b48-7b51-45bc-ad7f-723bcf50466c'
  AND status = 'inactive'
  AND apply_url LIKE '%cdljobcast.com%';