-- Update job listings to use Meta and X platforms instead of Indeed
-- Split the jobs roughly between Meta and X platforms

-- Update approximately half the jobs to use Meta platform
UPDATE job_listings 
SET platform_id = '62886281-5745-4cc9-9f97-3eded4add741' -- Meta platform ID
WHERE platform_id = 'e590e9dc-5b8b-4262-b2d3-9c72db98d822' -- Indeed platform ID
AND id IN (
    SELECT id 
    FROM job_listings 
    WHERE platform_id = 'e590e9dc-5b8b-4262-b2d3-9c72db98d822'
    ORDER BY created_at 
    LIMIT (SELECT COUNT(*) / 2 FROM job_listings WHERE platform_id = 'e590e9dc-5b8b-4262-b2d3-9c72db98d822')
);

-- Update the remaining jobs to use X platform
UPDATE job_listings 
SET platform_id = '384e675c-2dd2-476c-b0f2-b41d238014bf' -- X platform ID
WHERE platform_id = 'e590e9dc-5b8b-4262-b2d3-9c72db98d822'; -- Indeed platform ID